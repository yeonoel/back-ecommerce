
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { OrderItem } from '../order-items/entities/order-item.entity';
import { DashboardStatsDto, RevenueByMonthDto, TopProductDto, RecentOrderDto, LowStockProductDto } from './dto/dashboard-stat.dto';
import { PaymentStatus } from '../payments/enums/payment-status.enum';
import { UserRole } from '../users/enum/userRole.enum';
import { LowStockProductsForProducstStats, OutOfStockProductDto, ProductStatsDto } from '../dashboard/dto/products-stats.dto';
import { ProductVariant } from '../product-variants/entities/product-variant.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { calculateChange } from 'src/helper/calculChange';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(ProductVariant)
    private variantsRepository: Repository<ProductVariant>,
  ) {}

  /* async getStats(): Promise<DashboardStatsDto> {
    // Dates pour les calculs
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalRevenue,
      lastMonthRevenue,
      totalOrders,
      lastMonthOrders,
      totalProducts,
      lastMonthProducts,
      totalCustomers,
      lastMonthCustomers,
      revenueByMonth,
      topProducts,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      this.calculateTotalRevenue(),
      this.calculateTotalRevenue(startOfLastMonth, endOfLastMonth),
      this.countOrders(),
      this.countOrders(startOfLastMonth, endOfLastMonth),
      this.countProducts(),
      this.countProducts(startOfLastMonth, endOfLastMonth),
      this.countCustomers(),
      this.countCustomers(startOfLastMonth, endOfLastMonth),
      this.getRevenueByMonth(startOfYear, now),
      this.getTopProducts(10),
      this.getRecentOrders(5),
      this.getLowStockProducts(),
    ]);

    return {
      // KPIs
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,

      // Évolutions
      revenueChange: calculateChange(totalRevenue, lastMonthRevenue, 'vs mois dernier'),
      ordersChange: calculateChange(totalOrders, lastMonthOrders, 'vs mois dernier'),
      productsChange: calculateChange(totalProducts, lastMonthProducts, 'vs mois dernier'),
      customersChange: calculateChange(totalCustomers, lastMonthCustomers, 'vs mois dernier'),

      // Graphiques
      revenueByMonth,
      topProducts,
      recentOrders,
      lowStockProducts,
    };
  } */


  async getStats(): Promise<DashboardStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfToday = today;  
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Ventes du jour
    const salesToday = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.total), 0)', 'total')
      .where('order.paymentStatus = :paid', { paid: PaymentStatus.PAID })
      .andWhere('order.paidAt BETWEEN :start AND :end', {start: startOfToday, end: endOfToday,})
      .getRawOne();

    // Ventes du mois
    const salesThisMonth = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.total), 0)', 'total')
      .where('order.paymentStatus = :paid', { paid: PaymentStatus.PAID })
      .andWhere('order.paidAt >= :startOfMonth', { startOfMonth })
      .getRawOne();

    // Commandes en attente de livraison
    const pendingDeliveries = await this.orderRepository.count({
      where: [
        {status: OrderStatus.SHIPPED},
        {status: OrderStatus.CONFIRMED},
      ]});

    // Produits en rupture (variants)
    const outOfStockProducts = await this.variantsRepository
      .createQueryBuilder('variant')
      .where('variant.isDeleted = false')
      .andWhere('variant.isActive = true')
      .andWhere('(variant.stockQuantity - variant.reservedQuantity) <= 0')
      .getCount();

    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [totalRevenue, lastMonthRevenue ] = await Promise.all([
      this.calculateTotalRevenue(),
      this.calculateTotalRevenue(startOfLastMonth, endOfLastMonth),
    ]);

    return {
      salesToday: Number(salesToday.total),
      salesThisMonth: Number(salesThisMonth.total),
      totalRevenue: totalRevenue,
      pendingDeliveries,
      outOfStockProducts,
      revenueChange: calculateChange(totalRevenue, lastMonthRevenue, 'vs mois dernier'),
    };
  }


  /**
 * Statistiques des produits
 * @returns 
 */
async getProductsStats(): Promise<ProductStatsDto> {
    // Exécuter toutes les requêtes en parallèle pour optimiser
    const [
      totalProducts,
      inventoryValue,
      lowStockCount,
      outOfStockCount,
      lowStockProducts,
      outOfStockProducts,
      activeProducts,
      inactiveProducts,
      featuredProducts,
      totalVariants,
    ] = await Promise.all([
      this.countTotalProducts(),
      this.calculateInventoryValue(),
      this.countLowStock(),
      this.countOutOfStock(),
      this.getLowStockProductsForProducstStats(),
      this.getOutOfStockProducts(),
      this.countActiveProducts(),
      this.countInactiveProducts(),
      this.countFeaturedProducts(),
      this.countTotalVariants(),
    ]);

    return {
      totalProducts,
      inventoryValue,
      lowStockCount,
      outOfStockCount,
      lowStockProducts,
      outOfStockProducts,
      activeProducts,
      inactiveProducts,
      featuredProducts,
      totalVariants,
    };
}

/**
 * Calcul du revenu total
 * @param startDate 
 * @param endDate 
 * @returns 
 */ 
  private async calculateTotalRevenue(startDate?: Date, endDate?: Date): Promise<number> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.paymentStatus = :status', { status: PaymentStatus.PAID });
    if (startDate && endDate) {
      query.andWhere('order.paidAt BETWEEN :startDate AND :endDate', {startDate, endDate});
    }
    const result = await query.getRawOne();
    return parseFloat(result?.total || 0);
  }

  /**
   * Calcul du revenu par mois
   * @param startDate 
   * @param endDate 
   * @returns 
   */
  private async getRevenueByMonth(startDate: Date, endDate: Date): Promise<RevenueByMonthDto[]> {
    const results = await this.orderRepository
      .createQueryBuilder('order')
      .select("TO_CHAR(order.paidAt, 'YYYY-MM')", 'month')
      .addSelect('SUM(order.total)', 'revenue')
      .addSelect('COUNT(order.id)', 'orders')
      .where('order.paymentStatus = :status', { status: PaymentStatus.PAID })
      .andWhere('order.paidAt BETWEEN :startDate AND :endDate', {startDate, endDate})
      .groupBy("TO_CHAR(order.paidAt, 'YYYY-MM')")
      .orderBy("TO_CHAR(order.paidAt, 'YYYY-MM')", 'ASC')
      .getRawMany();

    return results.map(result => ({
      month: result.month,
      revenue: parseFloat(result.revenue),
      orders: parseInt(result.orders, 10),
      label: this.formatMonthLabel(result.month),
    }));
  }

  /**
   * Compte le nombre de commande
   * @param startDate 
   * @param endDate 
   * @returns 
   */
  private async countOrders(startDate?: Date, endDate?: Date): Promise<number> {
    const query = this.orderRepository.createQueryBuilder('order');
    if (startDate && endDate) {
      query.where('order.createdAt BETWEEN :startDate AND :endDate', {startDate, endDate});
    }
    return query.getCount();
  }

/**
 * Récuperer les commande recentes
 * @param limit 
 * @returns 
 */
  private async getRecentOrders(limit: number): Promise<RecentOrderDto[]> {
    const orders = await this.orderRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: `${order.user.firstName} ${order.user.lastName}`,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
    }));
  }


  /**
   * Calcul le nombre de produits disponible
   * @param startDate 
   * @param endDate 
   * @returns 
   */
  private async countProducts(startDate?: Date, endDate?: Date): Promise<number> {
    const query = this.productRepository
      .createQueryBuilder('product')
      .where('product.isActive = :isActive', { isActive: true });

    if (startDate && endDate) {
      query.andWhere('product.createdAt BETWEEN :startDate AND :endDate', {startDate, endDate});
    }

    return query.getCount();
  }

  /**
   * Récupere les produits les plus vendus
   * @param limit 
   * @returns 
   */
  private async getTopProducts(limit: number): Promise<TopProductDto[]> {
    const results = await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.product', 'product')
      .leftJoin('orderItem.order', 'order')
      .select('product.id', 'id')
      .addSelect('product.name', 'name')
      .addSelect('SUM("orderItem"."quantity")', 'sales')
      .addSelect('SUM("orderItem"."quantity" * "orderItem"."unit_price")','revenue')
      .where('order.paymentStatus = :status', {status: PaymentStatus.PAID})
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy('revenue', 'DESC')
      .limit(limit)
      .getRawMany();

    const productIds = results.map(r => r.id);
    const products = await this.productRepository.find({
      where: { id: In(productIds) },
      relations: ['images', 'category'],
    });

    return results.map(r => {
      const product = products.find(p => p.id === r.id);
      return {
        id: r.id,
        name: r.name,
        sales: Number(r.sales),
        revenue: Number(r.revenue),
        image: product?.images?.[0]?.imageUrl,
        category: product?.category?.name,
      };
    });
  }


  /**
   * Produits bientot en rupture de stock
   * @returns 
   */
  private async getLowStockProducts(): Promise<LowStockProductDto[]> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.stockQuantity > 0')
      .andWhere('product.stockQuantity <= product.lowStockThreshold')
      .orderBy('product.stockQuantity', 'ASC')
      .limit(10)
      .getMany();

    return products.map(p => ({
      id: p.id,
      name: p.name,
      currentStock: p.stockQuantity,
      lowStockThreshold: p.lowStockThreshold,
      image: p.images?.[0]?.imageUrl,
    }));
  }


  /**
   * Calcul le nombre de clients
   * @param startDate 
   * @param endDate 
   * @returns 
   */
  private async countCustomers(startDate?: Date, endDate?: Date): Promise<number> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.CUSTOMER })
      .andWhere('user.isActive = :isActive', { isActive: true });

    if (startDate && endDate) {
      query.andWhere('user.createAt BETWEEN :startDate AND :endDate', {startDate,endDate});
    }

    return query.getCount();
  }

  /**
   * Format dela date
   * @param monthString 
   * @returns 
   */
  private formatMonthLabel(monthString: string): string {
    const [year, month] = monthString.split('-');
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
  }

/**
 * Calculer le nombre total de produits en stock
 * @returns 
 */
private async countTotalProducts(): Promise<number> {
    return this.productRepository.count();
}

/**
 * Calculer la valeur de l'inventaire (somme des prix des produits actifs * quantité en stock)
 * @returns 
 */
private async calculateInventoryValue(): Promise<number> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .select('SUM(product.price * product.stockQuantity)', 'totalValue')
      .where('product.isActive = :isActive', { isActive: true })
      .getRawOne();

    return parseFloat(result?.totalValue || 0);
  }

/**
 * Calculer le nombre de produits bientôt en rupture de stock
 * @returns 
 */
  private async countLowStock(): Promise<number> {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.stockQuantity > 0')
      .andWhere('product.stockQuantity <= product.lowStockThreshold')
      .getCount();
  }

  /**
   * Calculer le nombre de produits qui ont une quantité en stock insuffisant
   * @returns 
   */
  private async countOutOfStock(): Promise<number> {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.stockQuantity = 0')
      .getCount();
  }

  /**
   * recuperer Produits bientot en rupture de stock
   * @returns 
   */
  private async getLowStockProductsForProducstStats(): Promise<LowStockProductsForProducstStats[]> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.stockQuantity > 0')
      .andWhere('product.stockQuantity <= product.lowStockThreshold')
      .orderBy('product.stockQuantity', 'ASC')
      .limit(10)
      .getMany();

    return products.map(product => ({
      id: product.id,
      name: product.name,
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold,
      image: product.images?.find(img => img.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl,
      category: product.category?.name,
    }));
  }

  /**
   * recuperer Produits qui ont une quantité en stock insuffisant
   * @returns 
   */
  private async getOutOfStockProducts(): Promise<OutOfStockProductDto[]> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.stockQuantity = 0')
      .orderBy('product.updatedAt', 'DESC')
      .limit(10)
      .getMany();

    return products.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category?.name,
      image: product.images?.find(img => img.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl,
    }));
  }

  /**
   * Calculer le nombre de produits actifs
   * @returns 
   */
  private async countActiveProducts(): Promise<number> {
    return this.productRepository.count({
      where: { isActive: true },
    });
  }

  /**
   * Calculer le nombre de produits inactifs
   * @returns 
   */
  private async countInactiveProducts(): Promise<number> {
    return this.productRepository.count({
      where: { isActive: false },
    });
  }

  /**
   * Calculer le nombre de produits en vedette
   * @returns 
   */
  private async countFeaturedProducts(): Promise<number> {
    return this.productRepository.count({
      where: { isFeatured: true },
    });
  }

  /**
   * Calculer le nombre total de variants
   * @returns 
   */
  private async countTotalVariants(): Promise<number> {
    return this.variantsRepository.count();
  }
}



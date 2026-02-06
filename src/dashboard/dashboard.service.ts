
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, In } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { OrderItem } from '../order-items/entities/order-item.entity';
import { DashboardStatsDto, PercentageChangeDto, RevenueByMonthDto, TopProductDto, RecentOrderDto, LowStockProductDto } from './dto/dashboard-stat.dto';
import { PaymentStatus } from 'src/payments/enums/payment-status.enum';
import { UserRole } from 'src/users/enum/userRole.enum';
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
  ) {}

  async getStats(): Promise<DashboardStatsDto> {
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

    return results.map(r => ({
      month: r.month,
      revenue: parseFloat(r.revenue),
      orders: parseInt(r.orders, 10),
      label: this.formatMonthLabel(r.month),
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
}

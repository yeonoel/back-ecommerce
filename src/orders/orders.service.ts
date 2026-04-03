import { CreateOrderDto } from './dto/create-order.dto';
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, Or, LessThan, Between } from 'typeorm';
import { Order } from './entities/order.entity';
import { Cart } from '../carts/entities/cart.entity';
import { Product } from '../products/entities/product.entity';
import { Address } from '../addresses/entities/address.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { OrderItem } from '../order-items/entities/order-item.entity';
import { ProductVariant } from '../product-variants/entities/product-variant.entity';
import { OrderDto } from './dto/response/order-dto';
import { mapToOrderDto } from './mapper/map-to-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ResponseDto } from '../common/dto/responses/Response.dto';
import { PaginatedResponseDto } from '../common/dto/responses/paginated-response.dto';
import { OrderStatus } from './enums/order-status.enum';
import { PaymentStatus } from 'src/payments/enums/payment-status.enum';
import { OrderFilterParams } from './dto/order-filter-params.dto';
import { Store } from 'src/stores/entities/store.entity';
import { getWhatsAppRedirectUrl, notifyClientByWhatsApp } from 'src/common/helpers/buildWhatssapLink';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/enum/userRole.enum';
import { ShopCustomer } from 'src/shop-customer/entities/shop-customer.entity';
import { CartItem } from 'src/cart-items/entities/cart-item.entity';
import { Coupon } from 'src/coupons/entities/coupon.entity';
import { CouponUsage } from 'src/coupon-usage/entities/coupon-usage.entity';
import { CreateOrderItemDto } from 'src/order-items/dto/create-order-item.dto';
import { ResolvedOrderItem } from './type/ResolvedOrderItem';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * CRÉER une commande (Checkout)
   * @param userId l'ID de l'utilisateur
   * @param storeSlug le slug de la boutique
   * @param createOrderDto 
   * @return Promise<OrderDto>
   */
  async createOrder(sessionId: string, createOrderDto: CreateOrderDto, storeSlug: string): Promise<ResponseDto<OrderDto>> {
    return this.dataSource.transaction(async (manager) => {
      const store = await manager.findOne(Store, { where: { slug: storeSlug } });
      if (!store) {
        throw new NotFoundException('Boutique introuvable');
      }

      let user = await manager.findOneBy(User, { phone: createOrderDto.address?.phone });
      if (!user) {
        user = await manager.save(User, {
          phone: createOrderDto.address?.phone,
          firstName: createOrderDto.address?.name,
          role: UserRole.CUSTOMER,
        });
      }

      const adress = await manager.findOne(Address, {
        where: {
          userId: user.id,
          city: createOrderDto.address?.city,
          neighborhood: createOrderDto.address?.neighborhood,
        },
      });
      if (!adress) {
        await manager.save(Address, {
          userId: user.id,
          store: store,
          city: createOrderDto.address?.city,
          neighborhood: createOrderDto.address?.neighborhood,
          user: user,
        });
      }

      await manager.upsert(ShopCustomer, { user, store }, { conflictPaths: ['user', 'storeId'] });

      const userId = user.id;

      // ✅ Résolution des items : panier OU commande directe
      let orderItems: ResolvedOrderItem[];
      let subtotal: number;
      let tax: number;
      let shippingCost: number;
      let discountAmount: number;
      let total: number;
      let couponCode: string | null;
      let cartToDelete: Cart | null = null;

      const hasDirectItems = createOrderDto.items && createOrderDto.items.length > 0;

      if (hasDirectItems) {
        // ─── CAS COMMANDE DIRECTE (sans panier) ───
        orderItems = await this.resolveDirectItems(createOrderDto.items, manager);
        subtotal = orderItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
        tax = 0;
        shippingCost = createOrderDto.shippingCost ?? 0;
        discountAmount = 0;
        couponCode = null;
        total = subtotal + tax + shippingCost - discountAmount;
      } else {
        // ─── CAS PANIER ───
        const cart = await manager.findOne(Cart, {
          where: { sessionId, store: { slug: storeSlug } },
          relations: ['items', 'items.product', 'items.variant'],
        });
        if (!cart || cart.items.length === 0) {
          throw new BadRequestException('Le panier est vide');
        }
        orderItems = cart.items.map((cartItem) => ({
          product: cartItem.product,
          variant: cartItem.variant ?? null,
          quantity: cartItem.quantity,
          unitPrice: cartItem.price,
        }));
        subtotal = cart.subtotal;
        tax = cart.tax;
        shippingCost = cart.shippingCost;
        discountAmount = cart.discountAmount;
        total = cart.total;
        couponCode = cart.couponCode;
        cartToDelete = cart;
      }

      // Vérification des stocks (commun aux deux cas)
      await this.checkStocks(orderItems, manager);

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 60);

      const orderNumber = await this.generateOrderNumber(manager);
      const { shippingSnapshot, billingSnapshot, address } = await this.checkAdress(createOrderDto, userId, manager);

      const order = await manager.save(Order, {
        orderNumber,
        store,
        user,
        paymentStatus: PaymentStatus.PENDING_PAYMENT,
        subtotal,
        tax,
        shippingCost,
        discountAmount,
        total,
        couponCode,
        shippingAddress: address,
        billingAddress: address,
        shippingAddressSnapshot: shippingSnapshot,
        billingAddressSnapshot: billingSnapshot,
        customerNote: createOrderDto.customerNote,
        paymentMethod: createOrderDto.paymentMethod,
        expiresAt,
      });

      // ✅ Création des OrderItems (commun aux deux cas)
      for (const item of orderItems) {
        await manager.save(OrderItem, {
          order: { id: order.id },
          product: { id: item.product.id },
          productVariant: item.variant ? { id: item.variant.id } : null,
          productName: item.product.name,
          productSku: item.product.sku,
          productSlug: item.product.slug,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
        });
      }

      // Décrémentation des stocks (commun aux deux cas)
      for (const item of orderItems) {
        if (item.variant?.id) {
          await manager.increment(ProductVariant, { id: item.variant.id }, 'reservedQuantity', item.quantity);
        } else {
          await manager.increment(Product, { id: item.product.id }, 'reservedQuantity', item.quantity);
        }
      }

      //Suppression du panier uniquement si on est passé par le panier
      if (cartToDelete) {
        await manager.delete(CartItem, { cart: { id: cartToDelete.id } });
        await manager.delete(Cart, { id: cartToDelete.id });
      }

      const fullOrder = await manager.findOne(Order, {
        where: { id: order.id },
        relations: ['items', 'items.product'],
      });
      if (!fullOrder) {
        throw new NotFoundException('Commande introuvable');
      }

      const whatsappUrl = getWhatsAppRedirectUrl(fullOrder, store);

      return {
        success: true,
        message: 'Commande crée avec success',
        data: mapToOrderDto(fullOrder),
        whatssappRedirectUrl: whatsappUrl,
      };
    });
  }

  //Résolution des items directs (récupère Product/Variant depuis la DB)
  private async resolveDirectItems(items: CreateOrderItemDto[], manager: EntityManager): Promise<ResolvedOrderItem[]> {
    const resolved: ResolvedOrderItem[] = [];
    for (const item of items) {
      const product = await manager.findOne(Product, { where: { id: item.productId } });
      if (!product) {
        throw new NotFoundException(`Produit introuvable: ${item.productId}`);
      }
      let variant: ProductVariant | null = null;
      if (item.variantId) {
        variant = await manager.findOne(ProductVariant, { where: { id: item.variantId } });
        if (!variant) {
          throw new NotFoundException(`Variant introuvable: ${item.variantId}`);
        }
      }
      const unitPrice = variant?.price ?? product.price;
      resolved.push({ product, variant, quantity: item.quantity, unitPrice: unitPrice ?? 0 });
    }
    return resolved;
  }

  //Vérification des stocks extraite en méthode commune
  private async checkStocks(items: ResolvedOrderItem[], manager: EntityManager): Promise<void> {
    for (const item of items) {
      let availableStock: number;
      let label: string;
      if (item.variant) {
        const variant = await manager.findOne(ProductVariant, { where: { id: item.variant.id } });
        if (!variant) throw new NotFoundException(`Variant introuvable`);
        availableStock = variant.availabledQuantity;
        label = `${item.product.name} - ${variant.name}`;
      } else {
        availableStock = item.product.availabledQuantity;
        label = item.product.name;
      }
      if (availableStock < item.quantity) {
        throw new BadRequestException(
          `Pas suffisant de stock pour ${label}. Disponible: ${availableStock}, Demandé: ${item.quantity}`,
        );
      }
    }
  }


  /**
 * Modifier le statut d'une commande (Admin)
 * @param orderId l'ID de la commande
 * @param storeSlug le slug de la boutique
 * @param newStatus le nouveau statut
 * @return Promise<OrderDto>
 */
  async updateOrderStatusBySeller(orderId: string, newStatus: OrderStatus, storeSlug: string): Promise<ResponseDto<OrderDto>> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, { where: { id: orderId, store: { slug: storeSlug } }, relations: ['items', 'store'] });
      if (!order) {
        throw new NotFoundException('Commande introuvable');
      }
      // Valider la transition de statut
      this.validateStatusTransition(order.status, newStatus);
      // Mettre à jour le statut
      order.status = newStatus;
      // Mettre à jour les dates selon le statut
      if (newStatus === OrderStatus.CONFIRMED_BY_CLIENT) {
        order.confirmedAt = new Date();
      } else if (newStatus === OrderStatus.DELIVERED) {
        order.deliveredAt = new Date();
      } else if (newStatus === OrderStatus.CANCELLED) {
        order.cancelledAt = new Date();
        // Restaurer le stock
        await this.restoreStock(order.items, manager);
      } else if (newStatus === OrderStatus.APPROVED_BY_SELLER) {
        order.approvedAt = new Date();
      }

      await manager.save(Order, order);
      // Notification
      await manager.save(Notification, {
        userId: order.user?.id,
        store: order.store,
        type: 'commande_status',
        title: `commande ${this.formatStatus(newStatus)}`,
        message: `Votre commande ${order.orderNumber} a maintenant le statut ${newStatus}`,
        metadata: { orderId: order.id },
      });

      return {
        success: true,
        message: 'Commande mise à jour avec success',
        data: mapToOrderDto(order),
      };
    });
  }

  /**
* Modifier le statut d'une commande (Admin)
* @param orderId l'ID de la commande
* @param storeSlug le slug de la boutique
* @param newStatus le nouveau statut
* @return Promise<OrderDto>
*/
  async updateOrderStatusByCustomer(orderId: string, newStatus: OrderStatus, storeSlug: string): Promise<ResponseDto<OrderDto>> {
    return this.dataSource.transaction(async (manager) => {
      const store = await manager.findOne(Store, { where: { slug: storeSlug } });
      if (!store) {
        throw new NotFoundException('Boutique introuvable');
      }
      const order = await manager.findOne(Order, { where: { id: orderId, store: { slug: storeSlug } }, relations: ['items', 'user'] });
      if (!order) {
        throw new NotFoundException('Commande introuvable');
      }

      if (
        newStatus !== OrderStatus.CONFIRMED_BY_CLIENT &&
        newStatus !== OrderStatus.CANCELLED
      ) {
        throw new BadRequestException('Statut non autorisé');
      }
      // Valider la transition de statut
      this.validateStatusTransition(order.status, newStatus);
      // Mettre à jour le statut
      order.status = newStatus;
      // Mettre à jour les dates selon le statut
      if (newStatus === OrderStatus.CONFIRMED_BY_CLIENT) {
        order.confirmedAt = new Date();
      } else if (newStatus === OrderStatus.CANCELLED) {
        order.cancelledAt = new Date();
        // Restaurer le stock
        const orderItems = await manager.find(OrderItem, { where: { order: { id: order.id } }, relations: ['product'] },);
        await this.restoreStock(orderItems, manager);
      }
      await manager.save(Order, order);
      // Notification
      await manager.save(Notification, {
        userId: order.user?.id,
        store: store,
        type: 'Commande Status',
        title: `Commande ${this.formatStatus(newStatus)}`,
        message: `Votre commande ${order.orderNumber} a maintenant le statut ${newStatus}`,
        metadata: { orderId: order.id },
      });

      return {
        success: true,
        message: 'Commande mise à jour avec success',
        data: mapToOrderDto(order),
      };
    });
  }

  /**
   * récupérer les commandes d'un utilisateur
   * @param userId id de l'utilisateur
   * @param storeSlug le slug de la boutique
   * @param paginationDto options de pagination
   * 
   */
  async getUserOrders(userId: string, paginationDto: PaginationDto, storeSlug: string): Promise<ResponseDto<PaginatedResponseDto<OrderDto>>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;
    const [orders, total] = await this.ordersRepository.findAndCount({
      where: { user: { id: userId }, store: { slug: storeSlug } },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return {
      success: true,
      message: 'User orders retrieved successfully',
      data: {
        items: orders.map(mapToOrderDto),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    };
  }

  /**
   * récupérer une commande par ID pour un utilisateur
   * @param userId l'ID de l'utilisateur
   * @param storeSlug le slug de la boutique
   * @param orderId l'ID de la commande
   * @return Promise<OrderDto>
   */
  async getOrderById(orderId: string, storeSlug: string): Promise<ResponseDto<OrderDto>> {
    const order = await this.ordersRepository.findOne(
      {
        where: { id: orderId, store: { slug: storeSlug } },
        relations: ['user', 'items', 'items.product']
      });
    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }
    return {
      success: true,
      message: 'Commande obtenue avec success',
      data: mapToOrderDto(order),
    };
  }

  async confirmeOrder(orderNumber: string, storeSlug: string): Promise<Order> {
    const order = await this.ordersRepository.findOne(
      {
        where: { orderNumber: orderNumber, store: { slug: storeSlug } },
        relations: ['store', 'shippingAddress']
      });
    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }
    order.status = OrderStatus.CONFIRMED_BY_CLIENT;
    order.updatedAt = new Date();

    return await this.ordersRepository.save(order);
  }

  /**
   * Annuler une commande par l'utilisateur
   * @param userId l'ID de l'utilisateur
   * @param storeSlug le slug de la boutique
   * @param orderId l'ID de la commande
   * @return Promise<OrderDto>
   */
  async cancelOrder(userId: string, orderId: string, storeSlug: string): Promise<ResponseDto<OrderDto>> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, { where: { id: orderId, store: { slug: storeSlug }, user: { id: userId } }, relations: ['items', 'user'] });
      if (!order) {
        throw new NotFoundException('Commande introuvable');
      }
      // Vérifier que la commande peut être annulée
      if (![OrderStatus.PENDING_CONFIRMATION].includes(order.status)) {
        throw new BadRequestException(
          `La commande ne peut pas etre annulée. Statut: ${order.status}`,
        );
      }
      // Mettre le statut à cancelled
      order.status = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      await manager.save(Order, order);
      // Notification
      await manager.save(Notification, {
        userId,
        type: 'Commande Status',
        title: 'Commande Annulée',
        message: `Votre commande ${order.orderNumber} a bien été annulée`,
        metadata: { orderId: order.id },
      });

      return {
        success: true,
        message: 'Commande annulée avec success',
        data: mapToOrderDto(order),
      };
    });
  }


  /**
   * recupérer toutes les commandes (Admin)
   * @param orderFilterParams options de filtre
   * @param storeSlug le slug de la boutique
   * @return Promise<ResponseDto<PaginatedResponseDto<OrderDto>>>
   */
  async getAllOrders(orderFilterParams: OrderFilterParams, storeSlug: string): Promise<ResponseDto<PaginatedResponseDto<OrderDto>>> {
    const { page = 1, limit = 100, status, date } = orderFilterParams;
    const skip = (page - 1) * limit;
    const whereCondition: any = {};
    if (storeSlug) {
      whereCondition.store = { slug: storeSlug };
    }
    if (status) {
      whereCondition.status = status;
    }
    if (date) {
      let start = new Date();
      start.setHours(0, 0, 0, 0)
      let end = new Date();
      end.setHours(23, 59, 59, 999)
      whereCondition.createdAt = Between(start, end);
    }

    const [orders, total] = await this.ordersRepository.findAndCount({
      where: whereCondition,
      relations: ['items', 'shippingAddress', 'billingAddress', 'user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return {
      success: true,
      message: 'Toutes les commandes recupérées avec success',
      data: {
        items: orders.map(mapToOrderDto),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  /**
   * Confirmer une commande par le client
   * @param orderId l'ID de la commande
   * @param storeSlug le slug de la boutique
   * @param idUser l'ID de l'utilisateur
   * @return Promise<OrderDto> la commande mise à jour
   */

  /**
   * Annuler une commande par vendeur
   * @param orderId l'ID de la commande
   * @param idUser l'ID de l'utilisateur
   * @param storeSlug le slug de la boutique
   * @return Promise<OrderDto>
   */
  async cancelOrderBySeller(orderId: string, storeSlug: string): Promise<OrderDto> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId, store: { slug: storeSlug } },
        relations: ['items', 'items.variant', 'items.product', 'user'],
      });
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      // Mettre à jour l'order
      order.status = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      order.expiresAt = null;
      await manager.save(Order, order);
      // Liberer le stock reservedQuantity
      await this.releaseStock(order.id);
      // notification
      try {
        await manager.save(Notification, {
          userId: order.user.id,
          type: 'order_status',
          title: 'Payment Failed',
          message: `Your payment for order ${order.orderNumber} has been cancelled!`,
          metadata: { orderId: order.id },
        });
      } catch (err) {
        console.error('Notification failed', err);
      }
      return mapToOrderDto(order);
    });
  }

  /**
   * Générer un numéro de commande unique
   * @param manager entité manager
   * @return le numéro de commande
   * 
   */
  private async generateOrderNumber(manager: any): Promise<string> {
    const year = new Date().getFullYear();
    const orderNum = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    return `ORD-${year}-${orderNum}`;
  }

  /**
   * Valider le changement de statut
   * @param currentStatus statut actuel
   * @param newStatus nouveau statut
   */
  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending_confirmation: [OrderStatus.CONFIRMED_BY_CLIENT, OrderStatus.CANCELLED],
      confirmed_by_client: [OrderStatus.APPROVED_BY_SELLER, OrderStatus.CANCELLED],
      approved_by_seller: [OrderStatus.DELIVERED],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Impossible de passer de: ${currentStatus} -> ${newStatus}`,
      );
    }
  }

  /**
   * formater le statut pour l'affichage dans la notification
   * @param status statut de la commande
   */
  private formatStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending_confirmation: OrderStatus.PENDING_CONFIRMATION,
      confirmed_by_client: OrderStatus.CONFIRMED_BY_CLIENT,
      approved_by_seller: OrderStatus.APPROVED_BY_SELLER,
      delivered: OrderStatus.DELIVERED,
      cancelled: OrderStatus.CANCELLED,
    };
    return statusMap[status] || status;
  }

  /**
   * 
   * @param createOrderDto 
   * @param userId 
   * @param manager 
   * @returns 
   */
  private async checkAdress(
    createOrderDto: CreateOrderDto,
    userId: string,
    manager: EntityManager): Promise<{ shippingSnapshot: any, billingSnapshot: any, address: Address }> {
    let address = await manager.findOne(Address, {
      where: {
        userId: userId,
        city: createOrderDto.address?.city,
        neighborhood: createOrderDto.address?.neighborhood,
        user: { id: userId }
      },
    });

    if (!address) {
      address = await manager.save(Address, {
        userId: userId,
        city: createOrderDto.address?.city,
        neighborhood: createOrderDto.address?.neighborhood,
        user: { id: userId }
      });
    }

    const snapshot = {
      city: address.city,
      neighborhood: address.neighborhood
    };

    return {
      shippingSnapshot: snapshot,
      billingSnapshot: snapshot,
      address: address,
    };
  }

  /**
 * restaurer le stock des produits d'une commande en cas de commande annulée
 * @param orderItems les items de la commande
 * @param manager entité manager
 * @return
 */
  private async restoreStock(orderItems: OrderItem[], manager: any): Promise<void> {
    for (const item of orderItems) {
      if (item.variant?.id) {
        await manager.increment(ProductVariant, { id: item.variant.id }, 'stockQuantity', item.quantity);
      } else {
        await manager.increment(Product, { id: item.product.id }, 'stockQuantity', item.quantity);
      }
    }
  }

  /**
   * Libérer le stock (échec paiement ou expiration)
   * @param orderId l'ID de la commande
   */
  async releaseStock(orderId: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, { where: { id: orderId }, relations: ['items', 'items.variant', 'items.product'] });
      if (!order) {
        throw new NotFoundException('Commande introuvable');
      }
      for (const item of order.items) {
        if (item.variant) {
          await manager.decrement(ProductVariant, { id: item.variant.id }, 'reservedQuantity', item.quantity);
        } else {
          await manager.decrement(Product, { id: item.product.id }, 'reservedQuantity', item.quantity);
        }
      }
    });
  }
}
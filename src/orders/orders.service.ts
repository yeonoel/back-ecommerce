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
  async createOrder(userId: string, createOrderDto: CreateOrderDto, storeSlug: string): Promise<ResponseDto<OrderDto>> {
    return this.dataSource.transaction(async (manager) => {
      const store = await manager.findOne(Store, { where: { slug: storeSlug } });
      if (!store) {
        throw new NotFoundException('Store not found');
      }
      const cart = await manager.findOne(Cart, {
        where: { user: { id: userId }, store: { slug: storeSlug } },
        relations: ['items', 'items.product', 'items.variant'],
      });
      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }
      // vérifier les stocks de tous les items du panier
      for (const cartItem of cart.items) {
        let availableStock: number;
        let productName: string;
        if (cartItem.variant) {
          const variant = await manager.findOne(ProductVariant, {
            where: { id: cartItem.variant.id },
          });
          if (!variant) {
            throw new NotFoundException(`Variant not found`);
          }
          availableStock = variant.availabledQuantity;
          productName = `${cartItem.product.name} - ${variant.name}`;
        } else {
          availableStock = cartItem.product.availabledQuantity;
          productName = cartItem.product.name;
        }
        console.log(cartItem.quantity, 'cart Item quantity');
        if (availableStock < cartItem.quantity) {
          throw new BadRequestException(
            `Not enough stock for ${productName}. Available: ${availableStock}, Requested: ${cartItem.quantity}`,
          );
        }
      }
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 60); // 60 minutes à partir de maintenant
      // générer un numéro de commande unique
      const orderNumber = await this.generateOrderNumber(manager);
      // Préparer les snapshots d'adresse
      const { shippingSnapshot, billingSnapshot, address } = await this.checkAdress(createOrderDto, userId, manager);
      const order = await manager.save(Order, {
        orderNumber,
        store,
        user: { id: userId },
        paymentStatus: PaymentStatus.PENDING_PAYMENT,
        subtotal: cart.subtotal,
        tax: cart.tax,
        shippingCost: cart.shippingCost,
        discountAmount: cart.discountAmount,
        total: cart.total,
        couponCode: cart.couponCode,
        shippingAddress: address,
        billingAddress: address,
        shippingAddressSnapshot: shippingSnapshot,
        billingAddressSnapshot: billingSnapshot,
        customerNote: createOrderDto.customerNote,
        paymentMethod: createOrderDto.paymentMethod,
        expiresAt,
      });
      // creer les orders items (Snapshot des produits)
      for (const cartItem of cart.items) {
        const product = cartItem.product;
        const variant = cartItem.variant;
        await manager.save(OrderItem, {
          order: { id: order.id },
          product: { id: product?.id },
          variant: { id: variant?.id },
          productName: product.name,
          productSku: product.sku,
          productSlug: product.slug,
          variantName: variant?.name,
          quantity: cartItem.quantity,
          unitPrice: cartItem.price,
          totalPrice: cartItem.price * cartItem.quantity,
        });
      }
      // décrémenter les stocks
      for (const cartItem of cart.items) {
        if (cartItem.variant?.id) {
          await manager.increment(ProductVariant, { id: cartItem.variant.id }, 'reservedQuantity', cartItem.quantity);
        } else {
          // Stock géré par produit
          await manager.increment(Product, { id: cartItem.product.id }, 'reservedQuantity', cartItem.quantity);
        }
      }

      // retourner la commande complète avec les items
      const fullOrder = await manager.findOne(Order, {
        where: { id: order.id },
        relations: ['items', 'items.product'],
      });
      if (!fullOrder) {
        throw new NotFoundException('Order not found');
      }
      const whatsappUrl = getWhatsAppRedirectUrl(order, store);

      return {
        success: true,
        message: 'Order created successfully',
        data: mapToOrderDto(fullOrder),
        whatssappRedirectUrl: whatsappUrl,
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
  async getUserOrders(userId: string, paginationDto: PaginationDto, storeSlug?: string): Promise<ResponseDto<PaginatedResponseDto<OrderDto>>> {
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
  async getOrderById(userId: string, orderId: string, storeSlug: string): Promise<ResponseDto<OrderDto>> {
    const order = await this.ordersRepository.findOne(
      {
        where: { id: orderId, store: { slug: storeSlug } },
        relations: ['user', 'items', 'items.product']
      });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.user?.id !== userId) {
      throw new ForbiddenException('You can only retrieve your own orders');
    }
    return {
      success: true,
      message: 'Order retrieved successfully',
      data: mapToOrderDto(order),
    };
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
        throw new NotFoundException('Order not found');
      }
      // Vérifier que la commande peut être annulée
      if (![OrderStatus.PENDING_CONFIRMATION].includes(order.status)) {
        throw new BadRequestException(
          `Cannot cancel order with status: ${order.status}`,
        );
      }
      // Mettre le statut à cancelled
      order.status = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      await manager.save(Order, order);
      // Notification
      await manager.save(Notification, {
        userId,
        type: 'order_status',
        title: 'Order Cancelled',
        message: `Your order ${order.orderNumber} has been cancelled`,
        metadata: { orderId: order.id },
      });

      return {
        success: true,
        message: 'Order cancelled successfully',
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
  async updateOrderStatus(orderId: string, newStatus: OrderStatus, storeSlug: string): Promise<ResponseDto<OrderDto>> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, { where: { id: orderId, store: { slug: storeSlug } }, relations: ['items'] });
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      // Valider la transition de statut
      this.validateStatusTransition(order.status, newStatus);
      // Mettre à jour le statut
      order.status = newStatus;
      // Mettre à jour les dates selon le statut
      if (newStatus === OrderStatus.DELIVERED) {
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
        type: 'order_status',
        title: `Order ${this.formatStatus(newStatus)}`,
        message: `Your order ${order.orderNumber} is now ${newStatus}`,
        metadata: { orderId: order.id },
      });

      return {
        success: true,
        message: 'Order status updated successfully',
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
      message: 'All orders retrieved successfully',
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
  async confirmPurchase(orderId: string, storeSlug: string, idUser: string): Promise<OrderDto> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId, store: { slug: storeSlug }, user: { id: idUser } },
        relations: ['items', 'items.variant', 'items.product', 'user'],
      });
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      // Mettre à jour l'order
      order.status = OrderStatus.CONFIRMED_BY_CLIENT;
      order.confirmedAt = new Date();
      order.expiresAt = null;
      await manager.save(Order, order);
      // notification
      await manager.save(Notification, {
        userId: order.user.id,
        type: 'order_status',
        title: 'Order Confirmed',
        message: `You have successfully confirmed order ${order.orderNumber}!`,
        metadata: { orderId: order.id },
      });
      return mapToOrderDto(order);
    });
  }

  /**
   * Approver une commande par le vendeur
   * @param orderId l'ID de la commande
   * @param storeSlug le slug de la boutique
   * @return Promise<OrderDto>
   */
  async OrderAprouvedBySeller(orderId: string, storeSlug: string): Promise<ResponseDto<OrderDto>> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId, store: { slug: storeSlug } },
        relations: ['items', 'items.variant', 'items.product', 'user'],
      });
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      // Convertir réservation en vente
      for (const item of order.items) {
        if (item.variant) {
          // Décrémenter stock ET réservation
          if (item.variant.stockQuantity < item.quantity) {
            throw new BadRequestException('Not enough stock for some items');
          }
          await manager.decrement(ProductVariant, { id: item.variant.id }, 'stockQuantity', item.quantity,);
          await manager.decrement(ProductVariant, { id: item.variant.id }, 'reservedQuantity', item.quantity);
        } else {
          if (item.product.stockQuantity < item.quantity) {
            throw new BadRequestException('Not enough stock for some items');
          }
          await manager.decrement(Product, { id: item.product.id }, 'stockQuantity', item.quantity);
          await manager.decrement(Product, { id: item.product.id }, 'reservedQuantity', item.quantity,);
        }
      }
      // Mettre à jour l'order
      order.status = OrderStatus.APPROVED_BY_SELLER;
      order.approvedAt = new Date();
      order.expiresAt = null;
      await manager.save(Order, order);
      // notification
      await manager.save(Notification, {
        userId: order.user.id,
        type: 'order_status',
        title: 'Order Confirmed',
        message: `Your order ${order.orderNumber} has been confirmed!`,
        metadata: { orderId: order.id },
      });
      const whatsappUrl = notifyClientByWhatsApp(order, order.store, order?.user?.phone);
      return {
        success: true,
        message: 'Order approved successfully',
        data: mapToOrderDto(order),
        whatssappRedirectUrl: whatsappUrl
      }
    });
  }

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
    const count = await manager.count(Order);
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
        `Invalid status transition: ${currentStatus} -> ${newStatus}`,
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
        streetAddress: createOrderDto.address.streetAddress,
        userId: userId,
        city: createOrderDto.address.city,
        apartment: createOrderDto.address.apartment,
        postalCode: createOrderDto.address.postalCode,
        country: createOrderDto.address.country,
        state: createOrderDto.address.state,
        user: { id: userId }
      },
    });

    if (!address) {
      address = await manager.save(Address, {
        userId: userId,
        addressType: createOrderDto.address.addressType,
        streetAddress: createOrderDto.address.streetAddress,
        apartment: createOrderDto.address.apartment,
        city: createOrderDto.address.city,
        state: createOrderDto.address.state,
        postalCode: createOrderDto.address.postalCode,
        country: createOrderDto.address.country,
      });
    }

    const snapshot = {
      streetAddress: address.streetAddress,
      apartment: address.apartment,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
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
        throw new NotFoundException('Order not found');
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
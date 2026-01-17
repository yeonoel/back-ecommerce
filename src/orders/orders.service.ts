import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import {Injectable, NotFoundException, BadRequestException, ForbiddenException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, Or } from 'typeorm';
import { Order } from './entities/order.entity';
import { Cart } from '../carts/entities/cart.entity';
import { CartItem } from '../cart-items/entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { Address } from '../addresses/entities/address.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { OrderItem } from '../order-items/entities/order-item.entity';
import { CouponUsage } from '../coupon-usage/entities/coupon-usage.entity';
import { ProductVariant } from '../product-variants/entities/product-variant.entity';
import { OrderDto } from './dto/response/order-dto';
import { mapToOrderDto } from './mapper/map-to-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ResponseDto } from '../common/dto/responses/Response.dto';
import { PaginatedResponseDto } from '../common/dto/responses/paginated-response.dto';
import { OrderStatus } from './enums/order-status.enum';
import { PaymentStatus } from 'src/payments/enums/payment-status.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Cart)
    private readonly cartsRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemsRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly productVariantsRepository: Repository<ProductVariant>,
    @InjectRepository(Address)
    private readonly addressesRepository: Repository<Address>,
    @InjectRepository(Coupon)
    private readonly couponsRepository: Repository<Coupon>,
    @InjectRepository(CouponUsage)
    private readonly couponUsageRepository: Repository<CouponUsage>,
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * CRÉER une commande (Checkout)
   * @param userId l'ID de l'utilisateur
   * @param createOrderDto 
   * @return Promise<OrderDto>
   */
  async createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<ResponseDto<OrderDto>> {
    return this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
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
          availableStock = variant.stockQuantity;
          productName = `${cartItem.product.name} - ${variant.name}`;
        } else {
          availableStock = cartItem.product.stockQuantity;
          productName = cartItem.product.name;
        }

        if (availableStock < cartItem.quantity) {
          throw new BadRequestException(
            `Not enough stock for ${productName}. Available: ${availableStock}, Requested: ${cartItem.quantity}`,
          );
        }
      }
      // générer un numéro de commande unique
      const orderNumber = await this.generateOrderNumber(manager);
      // Préparer les snapshots d'adresse
      const { shippingSnapshot, billingSnapshot, address } = await this.checkAdress(createOrderDto, userId, manager);
      const order = await manager.save(Order, {
        orderNumber,
        userId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
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
      });
      // creer les orders items (Snapshot des produits)
      for (const cartItem of cart.items) {
        const product = cartItem.product;
        const variant = cartItem.variant;
        await manager.save(OrderItem, {
          orderId: order.id,
          productId: product.id,
          variantId: variant?.id,
          productName: product.name,
          productSku: product.sku, 
          variantName: variant?.name,
          quantity: cartItem.quantity,
          unitPrice: cartItem.price, 
          totalPrice: cartItem.price * cartItem.quantity,
        });
      }
      // décrémenter les stocks
      for (const cartItem of cart.items) {
        if (cartItem.variant?.id) {
          await manager.decrement(ProductVariant, { id: cartItem.variant.id },'stockQuantity', cartItem.quantity);
        } else {
          // Stock géré par produit
          await manager.decrement(Product,{ id: cartItem.product.id },'stockQuantity', cartItem.quantity);
        }
      }
      // gérer les coupon si appliqué
      if (cart.couponCode) {
        const coupon = await manager.findOne(Coupon, {where: { code: cart.couponCode }});
        if (coupon) {
          // Incrémenter usage_count
          await manager.increment(Coupon, { id: coupon.id }, 'usageCount', 1);
          // Créer coupon_usage
          await manager.save(CouponUsage, {couponId: coupon.id, userId, orderId: order.id, discountAmount: cart.discountAmount});
        }
      }
      // vider le panier
      await manager.delete(CartItem, { cart: { id: cart.id } });
      await manager.update(Cart,{ id: cart.id },
        {
          subtotal: 0,
          tax: 0,
          shippingCost: 0,
          discountAmount: 0,
          total: 0,
          couponCode: null,
        },
      );
      // créer une notification
      await manager.save(Notification, {
        userId,
        type: 'order_status',
        title: 'Order Created',
        message: `Your order ${orderNumber} has been created successfully`,
        metadata: { orderId: order.id },
      });
      // retourner la commande complète avec les items
      const fullOrder = await manager.findOne(Order, {
        where: { id: order.id },
        relations: ['items', 'items.product'],
      });
      if (!fullOrder) {
        throw new NotFoundException('Order not found');
      }
      return {
        success: true,
        message: 'Order created successfully',
        data: mapToOrderDto(fullOrder),
      };
    });
  }

  /**
   * récupérer les commandes d'un utilisateur
   * @param userId id de l'utilisateur
   * @param paginationDto options de pagination
   * 
   */
  async getUserOrders(userId: string,paginationDto: PaginationDto,): Promise<ResponseDto<PaginatedResponseDto<OrderDto>>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;
    const [orders, total] = await this.ordersRepository.findAndCount({
      where: { user: { id: userId } },
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
   * @param orderId l'ID de la commande
   * @return Promise<OrderDto>
   */
  async getOrderById(userId: string, orderId: string): Promise<ResponseDto<OrderDto>> {
    const order = await this.ordersRepository.findOne({where: { id: orderId }, relations: ['items', 'items.product']});
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.user?.id !== userId) {
        throw new ForbiddenException('You can only cancel your own orders');
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
   * @param orderId l'ID de la commande
   * @return Promise<OrderDto>
   */
  async cancelOrder(userId: string, orderId: string): Promise<ResponseDto<OrderDto>> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {where: { id: orderId }, relations: ['items']});
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      // Vérifier ownership
      if (order.user?.id !== userId) {
        throw new ForbiddenException('You can only cancel your own orders');
      }
      // Vérifier que la commande peut être annulée
      if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
        throw new BadRequestException(
          `Cannot cancel order with status: ${order.status}`,
        );
      }
      // Mettre le statut à cancelled
      order.status = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      await manager.save(Order, order);
      // Restaurer le stock
      await this.restoreStock(order.items, manager);
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
   *  Modifier le statut d'une commande (Admin)
   * @param orderId l'ID de la commande
   * @param newStatus le nouveau statut
   * @return Promise<OrderDto>
   */
  async updateOrderStatus(orderId: string,newStatus: OrderStatus): Promise<ResponseDto<OrderDto>> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items'],
      });
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      // Valider la transition de statut
      this.validateStatusTransition(order.status, newStatus);
      // Mettre à jour le statut
      order.status = newStatus;
      // Mettre à jour les dates selon le statut
      if (newStatus === OrderStatus.SHIPPED) {
        order.shippedAt = new Date();
      } else if (newStatus === OrderStatus.DELIVERED) {
        order.deliveredAt = new Date();
      } else if (newStatus === OrderStatus.CANCELLED) {
        order.cancelledAt = new Date();
        // Restaurer le stock
        await this.restoreStock(order.items, manager);
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
   * @param paginationDto options de pagination
   * @return Promise<ResponseDto<PaginatedResponseDto<OrderDto>>>
   */
  async getAllOrders(paginationDto: PaginationDto,): Promise<ResponseDto<PaginatedResponseDto<OrderDto>>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;
    const [orders, total] = await this.ordersRepository.findAndCount({
      relations: ['items', 'shippingAddress', 'billingAddress'],
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
   * Générer un numéro de commande unique
   * @param manager entité manager
   * @return le numéro de commande
   * 
   */
  private async generateOrderNumber(manager: any): Promise<string> {
    const year = new Date().getFullYear();
    const count = await manager.count(Order);
    const orderNum = String(count + 1).padStart(5, '0');
    return `ORD-${year}-${orderNum}`;
  }

  /**
   * Valider le changement de statut
   * @param currentStatus statut actuel
   * @param newStatus nouveau statut
   */
  private validateStatusTransition(currentStatus: OrderStatus,newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      confirmed: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      processing: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      shipped: [OrderStatus.DELIVERED],
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
   * restaurer le stock des produits d'une commande en cas de commande annulée
   * @param orderItems les items de la commande
   * @param manager entité manager
   * @return
   */
  private async restoreStock(orderItems: OrderItem[], manager: any): Promise<void> {
    for (const item of orderItems) {
      if (item.variant?.id) {
        await manager.increment(
          ProductVariant,
          { id: item.variant.id },
          'stockQuantity',
          item.quantity,
        );
      } else {
        await manager.increment(
          Product,
          { id: item.product.id },
          'stockQuantity',
          item.quantity,
        );
      }
    }
  }

  /**
   * formater le statut pour l'affichage dans la notification
   * @param status statut de la commande
   */
  private formatStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: OrderStatus.PENDING,
      confirmed: OrderStatus.CONFIRMED,
      processing: OrderStatus.PROCESSING,
      shipped: OrderStatus.SHIPPED,
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
    manager: EntityManager): Promise<{shippingSnapshot: any, billingSnapshot: any, address: Address}> {
  let address = await manager.findOne(Address, {
        where: { 
          streetAddress: createOrderDto.address.streetAddress, 
          userId: userId, 
          city: createOrderDto.address.city,
          apartment: createOrderDto.address.apartment,
          postalCode: createOrderDto.address.postalCode,
          country: createOrderDto.address.country,
          state: createOrderDto.address.state,
          user: { id: userId } },
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
}


 


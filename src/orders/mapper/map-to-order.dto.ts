import { mapToOrderItemDto } from "src/order-items/mapper/map-To-OrderItem.dto";
import { OrderDto } from "../dto/response/order-dto";
import { Order } from "../entities/order.entity";

 /**
   * 🗺️ MAPPER Order Entity vers OrderDto
   */
  export const mapToOrderDto = (order: Order): OrderDto => {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order?.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      tax: order.tax,
      shippingCost: order.shippingCost,
      discountAmount: order.discountAmount,
      total: order.total,
      couponCode: order.couponCode || undefined,
      customerNote: order.customerNote,
      items: order.items?.map(mapToOrderItemDto) || [],
      itemsCount: order.items?.length || 0,
      shippingAddress: order.shippingAddressSnapshot,
      billingAddress: order.billingAddressSnapshot,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
    };
  }
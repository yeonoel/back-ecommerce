import { OrderItemDto } from "../dto/order-item.dto";
import { OrderItem } from "../entities/order-item.entity";

/**
   * MAPPER OrderItem Entity vers OrderItemDto
   * @param item OrderItem
   * @returns OrderItemDto
   */
  export const mapToOrderItemDto = (item: OrderItem): OrderItemDto => {
    return {
      id: item.id,
      productId: item.product?.id,
      productName: item.productName,
      productSku: item.productSku,
      variantId: item.variant?.id,
      variantName: item.variantName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    };
  }
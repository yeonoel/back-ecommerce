import { CartDto } from "../dto/responses/cart-dto";
import { Cart } from "../entities/cart.entity";
import { mapToCartItemDto } from "./map-to-cart-item-dto";

 /**
   * Mapper Cart Entity vers CartDto
   */
  export const mapToCartDto = (cart: Cart): CartDto => {
    const totalQuantity = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    return {
      id: cart.id,
      userId: cart.user?.id,
      sessionId: cart.sessionId,
      subtotal: cart.subtotal,
      tax: cart.tax,
      shippingCost: cart.shippingCost,
      discountAmount: cart.discountAmount,
      total: cart.total,
      couponCode: cart.couponCode,
      totalQuantity,
      items: cart.items?.map(mapToCartItemDto) || [],
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
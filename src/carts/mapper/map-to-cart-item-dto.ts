import { CartItemDto } from "src/cart-items/dto/responses/cart-item-dto";
import { CartItem } from "src/cart-items/entities/cart-item.entity";

 /**
   * Mapper CartItem Entity vers CartItemDto
   */
  export const mapToCartItemDto = (item: CartItem): CartItemDto => {
    const primaryImage = item.product?.images?.find((img) => img.isPrimary);

    return {
      id: item.id,
      productId: item.product?.id,
      productName: item.product?.name || '',
      productSlug: item.product?.slug || '',
      productImage: primaryImage?.imageUrl,
      variantId: item.variant?.id,
      variantName: item.variant?.name,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
    };
  }
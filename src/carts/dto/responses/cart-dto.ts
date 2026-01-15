import { CartItemDto } from "../../../cart-items/dto/responses/cart-item-dto";

export class CartDto {
  id: string;
  userId?: string;
  sessionId?: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  couponCode?: string;
  items: CartItemDto[];
  totalQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}
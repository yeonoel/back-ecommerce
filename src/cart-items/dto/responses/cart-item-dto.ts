export class CartItemDto {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage?: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  price: number;
  total: number;
}
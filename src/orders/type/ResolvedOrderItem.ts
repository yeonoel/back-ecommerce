import { ProductVariant } from "src/product-variants/entities/product-variant.entity";
import { Product } from "src/products/entities/product.entity";

export interface ResolvedOrderItem {
    product: Product;
    variant: ProductVariant | null;
    quantity: number;
    unitPrice: number;
}
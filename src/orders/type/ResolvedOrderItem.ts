import { ProductVariant } from "../../product-variants/entities/product-variant.entity";
import { Product } from "../../products/entities/product.entity";

export interface ResolvedOrderItem {
    product: Product;
    variant: ProductVariant | null;
    quantity: number;
    unitPrice: number;
}
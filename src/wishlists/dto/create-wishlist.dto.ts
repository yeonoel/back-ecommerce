import { IsOptional, IsUUID } from "class-validator";

export class CreateWishlistDto {
    @IsUUID()
    productId: string;
    @IsUUID()
    @IsOptional()
    variantId?: string;
}

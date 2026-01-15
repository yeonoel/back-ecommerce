import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateOrAddToCartDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

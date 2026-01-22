import { IsDateString, IsEnum, isEnum, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';
import { DiscountType } from '../enums/discount-type.dto';
import { Type } from 'class-transformer';
export class CreateCouponDto {
  @IsString()
  @Matches(/^[A-Z0-9_-]+$/, { message: 'Code must be uppercase alphanumeric with _ or -' })
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber()
  @Type(() => Number)
  discountValue: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPurchaseAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxDiscountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  usageLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  usageLimitPerUser?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

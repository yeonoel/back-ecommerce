import { IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ValidateCouponDto {
  @IsString()
  code: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cartSousTotal: number;
}
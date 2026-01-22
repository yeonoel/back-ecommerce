import { IsOptional, IsUUID, IsNumber, IsBoolean, IsString, IsIn, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CouponFilterDto {

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isValid?: boolean;

  @IsOptional()
  @IsIn(['validFrom', 'createdAt', 'validUntil'])
  sortBy?: 'validFrom' | 'createdAt'| 'validUntil';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
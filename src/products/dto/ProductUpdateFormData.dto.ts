import { IsArray, IsOptional, IsString } from 'class-validator';
import { ProductFormDataDto } from './ProductFormData.dto';
import { PartialType } from '@nestjs/mapped-types';

export class ProductUpdateFormDataDto extends PartialType(ProductFormDataDto) {
  @IsOptional()
  @IsString({ each: true })
  imagesToDelete?: string;
}

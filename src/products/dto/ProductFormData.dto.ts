import { IsArray, IsBooleanString, IsNotEmpty, IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

export class ProductFormDataDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  shortDescription?: string;

  @IsNumberString()
  @IsNotEmpty()
  price?: string;

  @IsOptional()
  @IsNumberString()
  compareAtPrice?: string;

  @IsOptional()
  @IsNumberString()
  costPrice?: string;

  @IsOptional()
  @IsString()
  imagesMeta?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumberString()
  stockQuantity?: string;

  @IsOptional()
  @IsNumberString()
  lowStockThreshold?: string;

  // Flags
  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @IsOptional()
  @IsBooleanString()
  isFeatured?: string;

  // Category
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  // SEO
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  // Dimensions
  @IsOptional()
  @IsNumberString()
  weight?: string;

  @IsOptional()
  @IsNumberString()
  length?: string;

  @IsOptional()
  @IsNumberString()
  width?: string;

  @IsOptional()
  @IsNumberString()
  height?: string;


  /**
   * variants arrive en JSON string car la requete est envoyé en multipart/form-data
   * ex: '[{"name":"Red","price":20000}]'
   */
  @IsOptional()
  @IsString()
  variants?: string;
}

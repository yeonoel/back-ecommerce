import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { CreateProductsImageDto } from 'src/products-images/dto/create-products-image.dto';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto extends PartialType(CreateProductDto) {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateProductsImageDto)
    newImages?: CreateProductsImageDto[]
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    imagesToDelete?: string[]
}

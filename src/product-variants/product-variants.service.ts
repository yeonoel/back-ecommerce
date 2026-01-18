import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { DataSource, EntityManager } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ResponseDto } from '../common/dto/responses/Response.dto';

@Injectable()
export class ProductVariantsService {
  constructor(private readonly dataSource: DataSource) {}
  async create(productId: string, createProductVariantDto: CreateProductVariantDto): Promise<ResponseDto> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const product = await manager.findOne(Product, { where: { id: productId } });
      if (!product) throw new NotFoundException('Product not found');
      if (createProductVariantDto.sku) {
        const skuExists = await manager.findOne(ProductVariant, { where: { sku: createProductVariantDto.sku } });
        if (skuExists) throw new ConflictException('Variant SKU already exists');
      }
      const variant = manager.create(ProductVariant, { ...createProductVariantDto, product });
      const savedVariant = await manager.save(variant);
      return {
        success: true,
        message: 'Variant created successfully',
        data: savedVariant,
      }
    });
  }

  async findAll(productId: string): Promise<ResponseDto> {
    const variants = await this.dataSource.getRepository(ProductVariant).find({
      where: { product: { id: productId } },
    });

    return {
      success: true,
      message: 'Variants found successfully',
      data: variants
    }
  }

  async findOne(id: string): Promise<ResponseDto> {
    const variant = await this.dataSource.getRepository(ProductVariant).findOne({ where: { id } });
    if (!variant) throw new NotFoundException('Variant not found');
    return {
      success: true,
      message: 'Variant found successfully',
      data: variant
    }
  }

  async update(id: string, updateProductVariantDto: UpdateProductVariantDto): Promise<ResponseDto> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const variant = await manager.findOne(ProductVariant, { where: { id }, relations: ['product'] });
      if (!variant) throw new NotFoundException('Variant not found');
      if (updateProductVariantDto.sku && updateProductVariantDto.sku !== variant.sku) {
        const exists = await manager.findOne(ProductVariant, { where: { sku: updateProductVariantDto.sku } });
        if (exists) throw new ConflictException('Variant SKU already exists');
      }
      Object.assign(variant, updateProductVariantDto);
      const savedVariant = await manager.save(variant);
      return {
        success: true,
        message: 'Variant updated successfully',
        data: savedVariant
      }
    });
  }

  async remove(id: string): Promise<ResponseDto> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const variant = await manager.findOne(ProductVariant, { where: { id } });
      if (!variant) throw new NotFoundException('Variant not found');
      await manager.remove(variant);
      return {
        success: true,
        message: 'Variant deleted successfully',
      }
    });
  }
}

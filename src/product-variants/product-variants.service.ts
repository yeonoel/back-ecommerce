import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { DataSource, EntityManager, Not } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ResponseDto } from '../common/dto/responses/Response.dto';
import { generateSku } from 'src/common/utils/sku.util';
import { OrderItem } from 'src/order-items/entities/order-item.entity';
import { not } from 'rxjs/internal/util/not';
import { OrderStatus } from 'src/orders/enums/order-status.enum';

@Injectable()
export class ProductVariantsService {
  constructor(private readonly dataSource: DataSource) {}
  /**
   * Create a variant for a product
   * @param productId The id of the product
   * @param createProductVariantDto The variant to create
   * @returns A response with the created variant
   * @throws NotFoundException If the product is not found
   * @throws ConflictException If the variant SKU already exists
   */
  async create(productId: string, createProductVariantDto: CreateProductVariantDto): Promise<ResponseDto> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const product = await manager.findOne(Product, { where: { id: productId }, relations: ['variants'] });
      if (!product) throw new NotFoundException('Product not found');
      if (product.variants.length === 1 && product.variants[0].color === 'Default' && product.variants[0].size === 'Default') {
        await manager.delete(ProductVariant, { id: product.variants[0].id });
      }
      if (createProductVariantDto.sku) {
        const skuExists = await manager.findOne(ProductVariant, { where: { sku: createProductVariantDto.sku } });
        if (skuExists) throw new ConflictException('Variant SKU already exists');
      }
      createProductVariantDto.sku = generateSku(product.name);
      const variant = manager.create(ProductVariant, { ...createProductVariantDto, product });
      const savedVariant = await manager.save(variant);
      return {
        success: true,
        message: 'Variant created successfully',
        data: savedVariant,
      }
    });
  }

/**
 * Find all variants for a product
 * @param productId The id of the product
 * @returns A response with the found variants
 */
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

/**
 * Finds a variant by its ID
 * @param id The ID of the variant to find
 * @returns A response with the found variant
 * @throws NotFoundException If the variant is not found
 */
  async findOne(id: string): Promise<ResponseDto> {
    const variant = await this.dataSource.getRepository(ProductVariant).findOne({ where: { id } });
    if (!variant) throw new NotFoundException('Variant not found');
    return {
      success: true,
      message: 'Variant found successfully',
      data: variant
    }
  }

  /**
   * Update a variant by its ID
   * @param id ID du variant
   * @param updateProductVariantDto Le variant mis à jour
   * @return Le variant mis à jour
   * @throws NotFoundException si le variant n'existe pas
   * @throws ConflictException si le SKU existe deja
   */
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


/**
 * Deletes a variant by its ID
 * @param id The ID of the variant to delete
 * @returns A response with the deleted variant
 * @throws NotFoundException If the variant is not found
 * @throws ConflictException If the variant is linked to an active or paid order
 */
  async remove(id: string): Promise<ResponseDto> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const variant = await manager.findOne(ProductVariant, { where: { id } });
      if (!variant) throw new NotFoundException('Variant not found');
      const existOrderItem = await manager.exists(OrderItem, { 
        where: { variant: { id },
        order: { status: Not(OrderStatus.CANCELLED) } } 
      });
      if (existOrderItem) throw new ConflictException('Cannot delete linked to active or paid order');

      const hasEnyOrder = await manager.exists(OrderItem, { where: { variant: { id } } });
      if (hasEnyOrder) {
        await manager.remove(variant);
        return {
          success: true,
          message: 'Variant deleted successfully',
        }
      }
      variant.isDeleted = true;
      await manager.save(variant);
      return {
        success: true,
        message: 'Variant deleted successfully',
      }
    });
  }
}

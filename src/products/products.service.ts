import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { DataSource, Repository } from 'typeorm';
import { ResponseDto } from 'src/common/dto/ResponseDto';
import { ProductImage } from 'src/products-images/entities/products-image.entity';
import { ProductVariant } from 'src/product-variants/entities/product-variant.entity';
import { generateSlug } from 'src/common/utils/slug.util';
import { generateVariantSku } from '../common/utils/sku.util';
import { create } from 'domain';
import { CreateProductsImageDto } from 'src/products-images/dto/create-products-image.dto';
import { CreateProductVariantDto } from 'src/product-variants/dto/create-product-variant.dto';
import { Category } from 'src/categories/entities/category.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepoisitory: Repository<Product>,
    private readonly dataSource: DataSource
  ) {}
  async createProduct(createDto: CreateProductDto): Promise<ResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const category = await manager.findOne(Category, { where: { id: createDto.categoryId } });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      const slug = generateSlug(createDto.name);
      if (createDto.sku) {
        const skuExists = await manager.findOne(Product, {
          where: { sku: createDto.sku },
        });

        if (skuExists) {
          throw new ConflictException('Product SKU already exists');
        }
      }

      const product = await manager.save(Product, {
        name: createDto.name,
        slug,
        description: createDto.description,
        shortDescription: createDto.shortDescription,
        price: createDto.price,
        compareAtPrice: createDto.compareAtPrice,
        costPrice: createDto.costPrice,
        sku: createDto.sku,
        stockQuantity: createDto.stockQuantity,
        isActive: true,
        isFeatured: createDto.isFeatured ?? false,
        weight: createDto.weight,
        length: createDto.length,
        width: createDto.width,
        height: createDto.height,
        categoryId: createDto.categoryId
      });

      if (createDto.images?.length) {
        const normalizedImages: CreateProductsImageDto[]  = this.normalizeImages(createDto.images);

        for (const image of normalizedImages) {
          await manager.save(ProductImage, {
            product,
            imageUrl: image.imageUrl,
            altText: image.altText,
            isPrimary: image.isPrimary,
            displayOrder: image.displayOrder ?? 0,
          });
        }
      }

      if (createDto.variants?.length) {
        this.checkDuplicateVariants(createDto.variants);

        for (const variant of createDto.variants) {
          let variantSku = variant.sku;
          if (!variantSku) {
            variantSku = generateVariantSku(product.sku, variant);
          }

          if (variantSku) {
            const variantSkuExists = await manager.findOne(ProductVariant, {
              where: { sku: variantSku },
            });

            if (variantSkuExists) {
              throw new ConflictException(
                `Variant SKU already exists: ${variantSku}`,
              );
            }
          }

          await manager.save(ProductVariant, {
            product,
            name: variant.name,
            color: variant.color,
            size: variant.size,
            material: variant.material,
            price: variant.price ?? product.price,
            stockQuantity: variant.stockQuantity,
            sku: variantSku,
            isActive: true,
          });
        }
      }

      // 7️⃣ RETURN PRODUCT (FULL)
      const fullProduct = await manager.findOne(Product, {
        where: { id: product.id },
        relations: ['images', 'variants', 'category'],
      });

      return {
        success: true,
        message: 'Product created successfully',
        data: fullProduct
      }
    });
  }

  async findAllProducts(): Promise<ResponseDto> {
    const products: Product[] = await this.productRepoisitory.find({where: {isActive: true}});
    if (!products) {
      throw new NotFoundException('product not found');
    }
    return {
      success: true,
      message: 'Products found successfully',
      data: products
    };
  }

  findById(id: string) {
    return `This action returns a #${id} product`;
  }

  updateProduct(id: string, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  removeProduct(id: string) {
    return `This action removes a #${id} product`;
  }


  /**
   * RULES:
   * - If none isPrimary → first = true
   * - If multiple isPrimary → only first stays true
   */
  private normalizeImages(images: CreateProductsImageDto[]) {
    let primaryFound = false;

    const normalized = images.map((img) => {
      if (img.isPrimary && !primaryFound) {
        primaryFound = true;
        return { ...img, isPrimary: true };
      }

      return { ...img, isPrimary: false };
    });

    if (!primaryFound && normalized.length > 0) {
      normalized[0].isPrimary = true;
    }

    return normalized;
  }

  /**
   * Prevent duplicate variants:
   * (color + size)
   */
  private checkDuplicateVariants(variants: CreateProductVariantDto[]): void {
    const set = new Set<string>();

    for (const variant of variants) {
      const key = `${variant.name}-${variant.color ?? ''}-${variant.size ?? ''}`;

      if (set.has(key)) {
        throw new ConflictException(`Duplicate variant detected (color: ${variant.color}, size: ${variant.size})`,
        );
      }

      set.add(key);
    }
  }
}

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
import { generate } from 'rxjs';
import { ProductFiltersDto } from './dto/ProductFiltersDto';
import { ResponseFilterDto } from './dto/ResponseFilterDto';

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
          throw new ConflictException('sku already exists');
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
        sku: createDto.sku ,
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

  async findAllProducts(filters: ProductFiltersDto): Promise<ResponseFilterDto> {
    const {category, minPrice, maxPrice, search, inStock, isFeatured, sortBy='createdAt', sortOrder='desc', page=1, limit=20} = filters;
    const query = this.productRepoisitory
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.variants', 'variants');

    if (category) {
      query.andWhere('product.categoryId = :category', { category });
    }
    if (minPrice) {
      query.andWhere('product.price >= :minPrice', { minPrice });
    }
    if (maxPrice) {
      query.andWhere('product.price <= :maxPrice', { maxPrice });
    }
    if (inStock) {
      query.andWhere('product.stockQuantity > 0');
    }
    if (isFeatured) {
      query.andWhere('product.isFeatured = :isFeatured', { isFeatured });
    }
    // RECHERCHE (pg_trgm ou LIKE)
    if (search) {
      query.andWhere(
        `(product.name ILIKE :search OR product.description ILIKE :search OR product.shortDescription ILIKE :search)`,
        { search: `%${search}%` },
      );
    }
    // TRI
    query.orderBy(`product.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
    //📄 PAGINATION
    const skip = (page - 1) * limit;
    query.skip(skip).limit(limit);    
    const [items, total] = await query.getManyAndCount();

    return {
      success: true,
      message: 'Products found successfully',
      data: items,
      meta: {
        items,
        total,
        page,
        limit
      }
    }
}

  async findById(id: string): Promise<ResponseDto> {
    const product = await this.productRepoisitory.findOne({
      where: {id: id},
      relations: ['images', 'variants', 'category']
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    product.variants = product.variants.filter(variant => variant.isActive);
    return {
      success: true,
      message: 'Product found successfully',
      data: product
    }
  }

  updateProduct(id: string, updateProductDto: UpdateProductDto) {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, 
        {
          where: { id},
          relations: ['images', 'variants']
        }
      );
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      // Vérifier si la categorie existe
      const category = await manager.findOne(Category, {where: { id: updateProductDto.categoryId }});
      if (!category) {
        throw new NotFoundException('Category not found');
      }

      if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
        const skuExists = await manager.findOne(Product, {
          where: {sku: updateProductDto.sku}
        });

        if (skuExists) {
          throw new ConflictException('sku already exists');
        }
        product.sku = updateProductDto.sku;
      }
      Object.assign(product, {
        name: updateProductDto.name ?? product.name,
        description: updateProductDto.description ?? product.description,
        shortDescription: updateProductDto.shortDescription ?? product.shortDescription,
        price: updateProductDto.price ?? product.price,
        compareAtPrice: updateProductDto.compareAtPrice ?? product.compareAtPrice,
        costPrice: updateProductDto.costPrice ?? product.costPrice,
        stockQuantity: updateProductDto.stockQuantity ?? product.stockQuantity,
        isFeatured: updateProductDto.isFeatured ?? product.isFeatured,
        weight: updateProductDto.weight ?? product.weight,
        length: updateProductDto.length ?? product.length,
        width: updateProductDto.width ?? product.width,
        height: updateProductDto.height ?? product.height,
        categoryId: updateProductDto.categoryId ?? product.category,
        isActive: updateProductDto.isActive ?? product.isActive,
      });

      if (updateProductDto.name) {
        product.slug = generateSlug(updateProductDto.name);
      }
      await manager.save(product);

      // Gestion de les images
      if (updateProductDto.images?.length) {
        await manager.delete(ProductImage, {product});
        const normalizedImages: CreateProductsImageDto[]  = this.normalizeImages(updateProductDto.images);

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
      //Gestion des variantes
      if (updateProductDto.variants?.length) {
        await manager.delete(ProductVariant, {product});

        this.checkDuplicateVariants(updateProductDto.variants);

        for (const variant of updateProductDto.variants) {
          let variantSku = variant.sku ?? generateVariantSku(product.sku, variant);
          const variantSkuExists = await manager.findOne(ProductVariant, {
            where: { sku: variantSku },
          });
          if (variantSkuExists) {
            throw new ConflictException(
              `Variant SKU already exists: ${variantSku}`,
            );
          }
          await manager.save(ProductVariant, {
            product,
            ...variant,
            sku: variantSku,
            price: variant.price ?? product.price,
            isActive: true,
          });
        }
      }

      const updatedProduct = await manager.findOne(Product, {
          where: { id },
          relations: ['images', 'variants', 'category'],
      });
          
      return {
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct,
      };
    })
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

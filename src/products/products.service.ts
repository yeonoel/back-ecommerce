import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { DataSource, EntityManager, Not, Repository } from 'typeorm';
import { ResponseDto } from 'src/common/dto/responses/Response.dto';
import { ProductImage } from 'src/products-images/entities/products-image.entity';
import { ProductVariant } from 'src/product-variants/entities/product-variant.entity';
import { generateSlug } from 'src/common/utils/slug.util';
import { generateSku, generateVariantSku } from '../common/utils/sku.util';
import { CreateProductVariantDto } from '../product-variants/dto/create-product-variant.dto';
import { ProductFiltersDto } from './dto/product-filters-dto';
import { ResponseFilterDto } from './dto/response-filter.dto';
import { UploadService } from '../upload/upload.service';
import { OrderItem } from 'src/order-items/entities/order-item.entity';
import { OrderStatus } from 'src/orders/enums/order-status.enum';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
    private readonly uploadService: UploadService
  ) { }
  async createProduct(createDto: CreateProductDto, files?: Express.Multer.File[]): Promise<ResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const slug = generateSlug(createDto.name);
      const existing = await manager.findOne(Product, { where: { slug } });
      if (existing) {
        throw new ConflictException('slug by name already exists');
      }
      if (createDto.sku) {
        const skuExists = await manager.findOne(Product, {
          where: { sku: createDto.sku },
        });
        if (skuExists) {
          throw new ConflictException('sku already exists');
        }
      } else {
        createDto.sku = generateSku(createDto.name);
      }
      // upload image sur cloudinary
      // Upload image pricipale
      let imageUrls: string[] = [];
      if (files?.length) {
        try {
          imageUrls = await this.uploadService.uploadMultipleImages(files);
        } catch (error) {
          throw new BadRequestException(`Image upload failed: ${error.message}`);
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
        isFeatured: createDto.isFeatured ?? false,
        weight: createDto.weight,
        length: createDto.length,
        width: createDto.width,
        height: createDto.height,
      });

      if (imageUrls?.length) {
        for (let i = 0; i < imageUrls.length; i++) {
          await manager.save(ProductImage, {
            product,
            imageUrl: imageUrls[i],
            altText: Product.name,
            isPrimary: i === 0,
            displayOrder: i,
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
            name: product.name,
            color: variant.color,
            size: variant.size,
            material: variant.material,
            price: variant.price ?? product.price,
            stockQuantity: variant.stockQuantity,
            sku: variantSku,
            isActive: true,
          });
        }
      } else {
        await manager.save(ProductVariant, {
          product,
          name: product.name,
          color: 'default',
          size: 'default',
          material: 'standard',
          price: product.price,
          stockQuantity: product.stockQuantity,
          sku: generateVariantSku(product.sku),
          isActive: true,
          isDeleted: true,
        });
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
  /*async createProduct(createDto: CreateProductDto, files?: Express.Multer.File[]): Promise<ResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const category = await manager.findOne(Category, { where: { id: createDto.categoryId } });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      const slug = generateSlug(createDto.name);
      const existing = await manager.findOne(Product, { where: { slug } });
      if (existing) {
        throw new ConflictException('slug by name already exists');
      }
      if (createDto.sku) {
        const skuExists = await manager.findOne(Product, {
          where: { sku: createDto.sku },
        });
        if (skuExists) {
          throw new ConflictException('sku already exists');
        }
      }
      // upload image sur cloudinary
      let imageUrls: string[] = [];
      if (files?.length) {
        try {
          imageUrls = await this.uploadService.uploadMultipleImages(files);
        } catch (error) {
          throw new BadRequestException(`Image upload failed: ${error.message}`);
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
        category: category
      });

      if (createDto.imagesMeta?.length && imageUrls?.length) {
        const normalizedImages: ImagesMetaDto[]  = this.normalizeImages(createDto.imagesMeta);
        for (let i = 0; i < imageUrls.length; i++) {
          await manager.save(ProductImage, {
            product,
            imageUrl: imageUrls[i],
            altText: normalizedImages[i]?.altText,
            isPrimary: normalizedImages[i]?.isPrimary,
            displayOrder: normalizedImages[i]?.displayOrder ?? 0,
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
  } */

  /**
   * Find all products based on the given filters
   * @param filters The filters to apply to the search
   * @returns A promise with a response containing the found products, and their total count
   */
  async findAllProducts(filters: ProductFiltersDto): Promise<ResponseFilterDto> {
    const { category, minPrice, maxPrice, search, inStock, isFeatured, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = filters;
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.variants', 'variants', 'variants.isDeleted = false AND variants.isActive = true')
      .where('product.isDeleted = false')
      .andWhere('product.isActive = true');

    if (category) {
      query.andWhere('product.category = :category', { category });
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
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async findById(id: string): Promise<ResponseDto> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect(
        'product.variants',
        'variants',
        'variants.isActive = true',
      )
      .leftJoinAndSelect('product.category', 'category')
      .where('product.id=:id', { id })
      .andWhere('product.isDeleted = false')
      .andWhere('product.isActive = true')
      .getOne();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      success: true,
      message: 'Product found successfully',
      data: {
        ...product,
        isOnSale: product.isOnSale,
        discountPercentage: product.discountPercentage,
        isLowStock: product.isLowStock,
        isOutOfStock: product.isOutOfStock
      }
    }
  }

  /**
   * Update a product
   * @param id The id of the product to update
   * @param updateProductDto The product to update
   * @param files The images to upload for the product
   * @returns A response with the updated product
   * @throws NotFoundException If the product is not found
   * @throws ConflictException If the SKU already exists
   */
  async updateProduct(id: string, updateProductDto: UpdateProductDto, files?: Express.Multer.File[]): Promise<ResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id },
        relations: ['images', 'variants'],
      });
      if (!product) throw new NotFoundException('Product not found');
      if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
        const skuExists = await manager.findOne(Product, { where: { sku: updateProductDto.sku } });
        if (skuExists) throw new ConflictException('SKU already exists');
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
        isActive: product.isActive,
      });

      await manager.save(product);

      if (files?.length || updateProductDto.newImages?.length) {
        let imageUrls: string[] = [];
        if (files?.length) {
          imageUrls = await this.uploadService.uploadMultipleImages(files);
          const existingImagesCount = await manager.count(ProductImage, {
            where: { product: { id: product.id } },
          });
          for (let i = 0; i < imageUrls.length; i++) {
            await manager.save(ProductImage, {
              product,
              imageUrl: imageUrls[i],
              altText: product.name,
              isPrimary: i === 0,
              displayOrder: existingImagesCount + i,
            });
          }
        }
      }
      if (updateProductDto.imagesToDelete?.length) {
        for (const id of updateProductDto.imagesToDelete) {
          const img = await manager.findOne(ProductImage, { where: { id, product: { id: product.id } } });
          if (!img) continue;
          const imgUrl = img.imageUrl;
          // suppression de l'image de cloudinary
          await this.uploadService.deleteImage(imgUrl);
          // suppression de l'image de la base de données
          await manager.delete(ProductImage, { id, product: { id: product.id } });
        }
      }
      this.uniqueImagePrimary(product.id, manager);
      /*if (updateProductDto.variants?.length) {
        await manager.delete(ProductVariant, { product });
        this.checkDuplicateVariants(updateProductDto.variants);

        for (const variant of updateProductDto.variants) {
          let variantSku = variant.sku ?? generateVariantSku(product.sku, variant);
          const variantSkuExists = await manager.findOne(ProductVariant, { where: { sku: variantSku } });
          if (variantSkuExists) {
            throw new ConflictException(`Variant SKU already exists: ${variantSku}`);
          }

          await manager.save(ProductVariant, {
            product,
            ...variant,
            sku: variantSku,
            price: variant.price ?? product.price,
            isActive: true,
          });
        }
      } */
      const updatedProduct = await manager.findOne(Product, {
        where: { id },
        relations: ['images', 'variants', 'category'],
      });
      if (!updatedProduct) throw new NotFoundException('Product not found');

      return {
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct,
      };
    });
  }

  /* 
  async updateProduct(id: string, updateProductDto: UpdateProductDto, files?: Express.Multer.File[]): Promise<ResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id },
        relations: ['images', 'variants'],
      });
      if (!product) throw new NotFoundException('Product not found');
      if (updateProductDto.categoryId) {
        const category = await manager.findOne(Category, { where: { id: updateProductDto.categoryId } });
        if (!category) throw new NotFoundException('Category not found');
        product.category = category;
      }
      if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
        const skuExists = await manager.findOne(Product, { where: { sku: updateProductDto.sku } });
        if (skuExists) throw new ConflictException('SKU already exists');
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
        isActive: updateProductDto.isActive ?? product.isActive,
      });
  
      if (updateProductDto.name) {
        product.slug = generateSlug(updateProductDto.name);
      }
  
      await manager.save(product);
  
      if (files?.length || updateProductDto.images?.length) {
        // Supprimer les anciennes images de Cloudinary
        for (const img of product.images) {
          if (img.imageUrl) {
            await this.uploadService.deleteImage(img.imageUrl);
          }
        }
        await manager.delete(ProductImage, { product });
        let imageUrls: string[] = [];
        if (files?.length) {
          imageUrls = await this.uploadService.uploadMultipleImages(files);
        }
        const normalizedImages: ImagesMetaDto[] = this.normalizeImages(updateProductDto.images ?? []);
        for (let i = 0; i < imageUrls.length; i++) {
          await manager.save(ProductImage, {
            product,
            imageUrl: imageUrls[i],
            altText: normalizedImages[i]?.altText,
            isPrimary: normalizedImages[i]?.isPrimary,
            displayOrder: normalizedImages[i]?.displayOrder ?? 0,
          });
        }
      }
      if (updateProductDto.variants?.length) {
        await manager.delete(ProductVariant, { product });
        this.checkDuplicateVariants(updateProductDto.variants);
  
        for (const variant of updateProductDto.variants) {
          let variantSku = variant.sku ?? generateVariantSku(product.sku, variant);
          const variantSkuExists = await manager.findOne(ProductVariant, { where: { sku: variantSku } });
          if (variantSkuExists) {
            throw new ConflictException(`Variant SKU already exists: ${variantSku}`);
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
    });
  }
  
  */

  async removeProduct(id: string): Promise<ResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, { where: { id } });
      if (!product) throw new NotFoundException('Product not found');
      const existOrderItem = await manager.exists(OrderItem, { where: { product: { id }, order: { status: Not(OrderStatus.CANCELLED) } } });
      console.log(existOrderItem, "existOrderItemoooooooooooooooooooooooooo");
      if (existOrderItem) throw new ConflictException('Cannot delete linked to active or paid order');
      console.log(existOrderItem, "existOrderItemmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm");
      const hasEnyOrder = await manager.exists(OrderItem, { where: { product: { id } } });
      if (hasEnyOrder) {
        await manager.remove(product);
        return {
          success: true,
          message: 'Product deleted successfully',
          data: product,
        };
      }
      product.isDeleted = true;
      await manager.save(product);
      return {
        success: true,
        message: 'Product deleted successfully',
        data: product,
      };
    });
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


  /*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Ensures that there is only one primary image for the given product
   * @param productId The ID of the product
   * @param manager The EntityManager instance
   * @returns A promise which resolves when the operation is complete
   */
  /*******  3b2b6db3-474a-4892-8e46-6a202f16c75e  *******/
  async uniqueImagePrimary(productId: string, manager: EntityManager): Promise<void> {
    const images = await manager.find(ProductImage, {
      where: { product: { id: productId } },
      order: { displayOrder: 'ASC' },
    });

    if (images.length > 0) {
      let primaryFound = false;
      for (const image of images) {
        if (image.isPrimary && !primaryFound) {
          primaryFound = true;
        } else {
          image.isPrimary = false;
        }
      }
      // Si aucune image principale → on met la première
      if (!primaryFound) {
        images[0].isPrimary = true;
      }
      await manager.save(images);
    }
  }
}

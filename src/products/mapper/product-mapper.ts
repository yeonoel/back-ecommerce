import { CreateProductDto } from '../dto/create-product.dto';
import { CreateProductsImageDto } from '../../products-images/dto/create-products-image.dto';
import { CreateProductVariantDto } from '../../product-variants/dto/create-product-variant.dto';
import { ProductFormDataDto } from '../dto/ProductFormData.dto';
import { ImagesMetaDto } from '../dto/images-meta.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductUpdateFormDataDto } from '../dto/ProductUpdateFormData.dto';

export class ProductMapper {
  static toCreateProductDto(form: ProductFormDataDto, imageUrls: string[]): CreateProductDto {
    const images: CreateProductsImageDto[] = [];
    let variants: CreateProductVariantDto[] | undefined;
    if (form.variants) {
      variants = JSON.parse(form.variants);
    }
    let imagesMeta: ImagesMetaDto[] = [];
    if (form.imagesMeta) {
      imagesMeta = JSON.parse(form.imagesMeta);
    }

    console.log('imagesMeta', imagesMeta);
    return {
      name: form.name,
      description: form.description,
      shortDescription: form.shortDescription,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      costPrice: form.costPrice ? Number(form.costPrice) : undefined,
      sku: form.sku,
      stockQuantity: form.stockQuantity ? Number(form.stockQuantity) : undefined,
      lowStockThreshold: form.lowStockThreshold ? Number(form.lowStockThreshold) : undefined,
      isActive: form.isActive === 'true',
      isFeatured: form.isFeatured === 'true',
      categoryId: form.categoryId,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      weight: form.weight ? Number(form.weight) : undefined,
      length: form.length ? Number(form.length) : undefined,
      width: form.width ? Number(form.width) : undefined,
      height: form.height ? Number(form.height) : undefined,
      images,
      variants,
      imagesMeta
    };
  }

  // product.mapper.ts - VERSION CONCISE

  static toUpdateProductDto(
    form: ProductUpdateFormDataDto,
    imageUrls: string[]
  ): UpdateProductDto {
    // Helper pour parser JSON de manière sûre
    const safeJsonParse = <T>(jsonString: string | undefined, fallback: T): T => {
      if (!jsonString) return fallback;
      try {
        return JSON.parse(jsonString);
      } catch (error) {
        console.error('❌ Erreur parsing JSON:', error);
        return fallback;
      }
    };

    // Helper pour convertir en nombre
    const toNumber = (value: any): number | undefined => {
      if (value === undefined || value === null || value === '') return undefined;
      const num = Number(value);
      return isNaN(num) ? undefined : num;
    };

    // Helper pour convertir en booléen
    const toBoolean = (value: any): boolean | undefined => {
      if (value === undefined || value === null) return undefined;
      return value === 'true' || value === true;
    };

    // Parser les champs JSON
    const variants = safeJsonParse<CreateProductVariantDto[] | undefined>(form.variants, undefined);
    const imagesMeta = safeJsonParse<ImagesMetaDto[]>(form.imagesMeta, []);
    const imagesToDelete = safeJsonParse<string[] | undefined>(form.imagesToDelete, undefined);

    console.log('🔄 Mapper - Parsing:', {
      hasVariants: !!variants,
      hasImagesMeta: imagesMeta.length > 0,
      imagesToDeleteCount: imagesToDelete?.length || 0
    });

    // Construire le DTO de manière propre
    const updateDto: UpdateProductDto = {
      // Champs texte
      ...(form.name && { name: form.name }),
      ...(form.description && { description: form.description }),
      ...(form.shortDescription && { shortDescription: form.shortDescription }),
      ...(form.sku && { sku: form.sku }),
      ...(form.categoryId && { categoryId: form.categoryId }),
      ...(form.metaTitle && { metaTitle: form.metaTitle }),
      ...(form.metaDescription && { metaDescription: form.metaDescription }),

      // Champs numériques
      ...(form.price && { price: toNumber(form.price) }),
      ...(form.compareAtPrice && { compareAtPrice: toNumber(form.compareAtPrice) }),
      ...(form.costPrice && { costPrice: toNumber(form.costPrice) }),
      ...(form.stockQuantity !== undefined && { stockQuantity: toNumber(form.stockQuantity) }),
      ...(form.lowStockThreshold && { lowStockThreshold: toNumber(form.lowStockThreshold) }),
      ...(form.weight && { weight: toNumber(form.weight) }),
      ...(form.length && { length: toNumber(form.length) }),
      ...(form.width && { width: toNumber(form.width) }),
      ...(form.height && { height: toNumber(form.height) }),

      // Champs booléens
      ...(form.isActive !== undefined && { isActive: toBoolean(form.isActive) }),
      ...(form.isFeatured !== undefined && { isFeatured: toBoolean(form.isFeatured) }),

      // Champs complexes (toujours inclus)
      newImages: [],
      imagesToDelete,
      variants,
      imagesMeta,
    };

    console.log('✅ UpdateProductDto:', {
      fields: Object.keys(updateDto).filter(key => updateDto[key] !== undefined),
      imagesToDelete: imagesToDelete?.length || 0
    });

    return updateDto;
  }
}

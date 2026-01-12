import { CreateProductDto } from '../dto/create-product.dto';
import { CreateProductsImageDto } from '../../products-images/dto/create-products-image.dto';
import { CreateProductVariantDto } from '../../product-variants/dto/create-product-variant.dto';
import { ProductFormDataDto } from '../dto/ProductFormData.dto';
import { ImagesMetaDto } from '../dto/images-meta.dto';

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
      compareAtPrice: form.compareAtPrice? Number(form.compareAtPrice) : undefined,
      costPrice: form.costPrice? Number(form.costPrice) : undefined,
      sku: form.sku,
      stockQuantity: form.stockQuantity? Number(form.stockQuantity) : undefined,
      lowStockThreshold: form.lowStockThreshold? Number(form.lowStockThreshold) : undefined,
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
}

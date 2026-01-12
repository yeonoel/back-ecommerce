import { CreateProductDto } from '../dto/create-product.dto';
import { CreateProductsImageDto } from '../../products-images/dto/create-products-image.dto';
import { CreateProductVariantDto } from '../../product-variants/dto/create-product-variant.dto';
import { CreateProductFormDataDto } from '../dto/CreateProductFormDataDto';

export class ProductMapper {
  static toCreateProductDto(form: CreateProductFormDataDto, imageUrls: string[]): CreateProductDto {
    const images: CreateProductsImageDto[] = imageUrls.map((url, index) => ({
      imageUrl: url,
      isPrimary: index === 0,
      displayOrder: index,
    }));
    let variants: CreateProductVariantDto[] | undefined;
    if (form.variants) {
      variants = JSON.parse(form.variants);
    }

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
    };
  }
}

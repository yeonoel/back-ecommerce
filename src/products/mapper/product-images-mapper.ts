// mapper/product-image.mapper.ts
import { ImagesMetaFormDto } from 'src/products-images/dto/image-meta-form.dto';
import { ImagesMetaDto } from '../dto/images-meta.dto';

export class ProductImageMapper {

  static toImagesMetaDtos(
    rawMeta?: ImagesMetaFormDto | ImagesMetaFormDto[],
  ): ImagesMetaDto[] {
    if (!rawMeta) return [];

    const metaArray = Array.isArray(rawMeta)? rawMeta : [rawMeta];

    return metaArray.map((meta, index) => ({
      altText: meta.altText?.trim(),
      isPrimary: meta.isPrimary === 'true',
      displayOrder: meta.displayOrder? Number(meta.displayOrder): index}));
  }
}

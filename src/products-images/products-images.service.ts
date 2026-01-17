import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { UploadService } from 'src/upload/upload.service';
import { Product } from '../products/entities/product.entity';
import { ProductImage } from './entities/products-image.entity';
import { ResponseDto } from '../common/dto/responses/Response.dto';
import { ImagesMetaFormDto } from './dto/image-meta-form.dto';
import { ProductImageMapper } from '../products/mapper/product-images-mapper';

@Injectable()
export class ProductsImagesService {
  constructor(
    private dataSource: DataSource,
    private uploadService: UploadService) {}

  async createMany(productId: string, files: Express.Multer.File[], meta?: ImagesMetaFormDto[]): Promise<ResponseDto> {
  if (!files?.length) {
    throw new BadRequestException('No files uploaded');
  }

  return this.dataSource.transaction(async (manager) => {
    const product = await manager.findOne(Product, {
      where: { id: productId },
      relations: ['images'],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Upload Cloudinary
    const urls = await this.uploadService.uploadMultipleImages(files);
    const normalizedMeta = ProductImageMapper.toImagesMetaDtos(meta);
    const hasIncomingPrimary = normalizedMeta.some(
      (m) => m?.isPrimary === true,
    );
    // Si un primary entrant existe on met tous les isprimary de la BD à false
    if (hasIncomingPrimary) {
      await manager.update(
        ProductImage,
        { product: { id: productId } },
        { isPrimary: false },
      );
    }
    let primaryAlreadySet = false;
    const images = urls.map((url, index) => {
      const metaItem = normalizedMeta[index];
      let isPrimary = false;
      if (hasIncomingPrimary) {
        if (metaItem?.isPrimary && !primaryAlreadySet) {
          isPrimary = true;
          primaryAlreadySet = true;
        }
      } else {
        isPrimary = false;
      }

      return manager.create(ProductImage, {
        product,
        imageUrl: url,
        altText: metaItem?.altText,
        isPrimary,
        displayOrder: metaItem?.displayOrder ?? index,
      });
    });
    const savedImages = await manager.save(images);
    return {
      success: true,
      message: 'Images created successfully',
      data: savedImages,
    };
  });
}

  async findAll(productId: string): Promise<ResponseDto> {
    const images = await this.dataSource.getRepository(ProductImage).find({
      where: { product: { id: productId } },
      order: { displayOrder: 'ASC' },
    });

    return {
      success: true,
      message: 'Images found successfully',
      data: images
    }
  }

  async remove(id: string): Promise<ResponseDto> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const image = await manager.findOne(ProductImage, { where: { id }, relations: ['product'] });
      if (!image) throw new NotFoundException('Image not found');
      // Supprimer sur Cloudinary
      await this.uploadService.deleteImage(image.imageUrl);

      await manager.remove(image);
      return {
        success: true,
        message: 'Image deleted successfully',
      }
    });
  }
}

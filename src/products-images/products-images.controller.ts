import { Controller, Get, Post, Body,  Param, Delete, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ProductsImagesService } from './products-images.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ImagesMetaDto } from '../products/dto/images-meta.dto';
import { ImagesMetaFormDto } from './dto/image-meta-form.dto';

@Controller('products-images')
export class ProductsImagesController {
  constructor(private readonly productsImagesService: ProductsImagesService) {}

  @Post()
@UseInterceptors(FilesInterceptor('images', 10))
async uploadImages(
  @Param('productId') productId: string,
  @UploadedFiles() files: Express.Multer.File[],
  @Body() meta?: ImagesMetaFormDto[],
) {
  return this.productsImagesService.createMany(productId, files, meta);
}


  @Get()
  async findAll(@Param('productId') productId: string) {
    return this.productsImagesService.findAll(productId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.productsImagesService.remove(id);
  }
}

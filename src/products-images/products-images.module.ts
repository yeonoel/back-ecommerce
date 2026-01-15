import { Module } from '@nestjs/common';
import { ProductsImagesService } from './products-images.service';
import { ProductsImagesController } from './products-images.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [ProductsImagesController],
  providers: [ProductsImagesService],

})
export class ProductsImagesModule {}

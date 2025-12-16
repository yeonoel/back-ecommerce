import { Test, TestingModule } from '@nestjs/testing';
import { ProductsImagesController } from './products-images.controller';
import { ProductsImagesService } from './products-images.service';

describe('ProductsImagesController', () => {
  let controller: ProductsImagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsImagesController],
      providers: [ProductsImagesService],
    }).compile();

    controller = module.get<ProductsImagesController>(ProductsImagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

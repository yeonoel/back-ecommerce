import { Test, TestingModule } from '@nestjs/testing';
import { ProductsImagesService } from './products-images.service';

describe('ProductsImagesService', () => {
  let service: ProductsImagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsImagesService],
    }).compile();

    service = module.get<ProductsImagesService>(ProductsImagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

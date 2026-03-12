import { Test, TestingModule } from '@nestjs/testing';
import { ShopCustomerController } from './shop-customer.controller';
import { ShopCustomerService } from './shop-customer.service';

describe('ShopCustomerController', () => {
  let controller: ShopCustomerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopCustomerController],
      providers: [ShopCustomerService],
    }).compile();

    controller = module.get<ShopCustomerController>(ShopCustomerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

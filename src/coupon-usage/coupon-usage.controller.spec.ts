import { Test, TestingModule } from '@nestjs/testing';
import { CouponUsageController } from './coupon-usage.controller';
import { CouponUsageService } from './coupon-usage.service';

describe('CouponUsageController', () => {
  let controller: CouponUsageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CouponUsageController],
      providers: [CouponUsageService],
    }).compile();

    controller = module.get<CouponUsageController>(CouponUsageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

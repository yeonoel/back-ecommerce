import { Test, TestingModule } from '@nestjs/testing';
import { CouponUsageService } from './coupon-usage.service';

describe('CouponUsageService', () => {
  let service: CouponUsageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CouponUsageService],
    }).compile();

    service = module.get<CouponUsageService>(CouponUsageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

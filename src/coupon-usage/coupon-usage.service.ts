import { Injectable } from '@nestjs/common';
import { CreateCouponUsageDto } from './dto/create-coupon-usage.dto';
import { UpdateCouponUsageDto } from './dto/update-coupon-usage.dto';

@Injectable()
export class CouponUsageService {
  create(createCouponUsageDto: CreateCouponUsageDto) {
    return 'This action adds a new couponUsage';
  }

  findAll() {
    return `This action returns all couponUsage`;
  }

  findOne(id: number) {
    return `This action returns a #${id} couponUsage`;
  }

  update(id: number, updateCouponUsageDto: UpdateCouponUsageDto) {
    return `This action updates a #${id} couponUsage`;
  }

  remove(id: number) {
    return `This action removes a #${id} couponUsage`;
  }
}

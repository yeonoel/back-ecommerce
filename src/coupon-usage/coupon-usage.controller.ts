import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CouponUsageService } from './coupon-usage.service';
import { CreateCouponUsageDto } from './dto/create-coupon-usage.dto';
import { UpdateCouponUsageDto } from './dto/update-coupon-usage.dto';

@Controller('coupon-usage')
export class CouponUsageController {
  constructor(private readonly couponUsageService: CouponUsageService) {}

  @Post()
  create(@Body() createCouponUsageDto: CreateCouponUsageDto) {
    return this.couponUsageService.create(createCouponUsageDto);
  }

  @Get()
  findAll() {
    return this.couponUsageService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.couponUsageService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCouponUsageDto: UpdateCouponUsageDto) {
    return this.couponUsageService.update(+id, updateCouponUsageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.couponUsageService.remove(+id);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, Req, Query } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Coupon } from './entities/coupon.entity';
import { CouponFilterDto } from './dto/coupon-filter.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@Controller('dashboard/:storeSlug/coupons')
@UseGuards(JwtAuthGuard)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) { }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCouponDto: CreateCouponDto, @CurrentUser() user: any): Promise<Coupon> {
    return this.couponsService.create(createCouponDto, user.storeId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  findAll(@Query() filters: CouponFilterDto, @CurrentUser() user: any) {
    return this.couponsService.findAllCoupons(filters, user.storeId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.couponsService.findOne(id, user.storeId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto, @CurrentUser() user: any) {
    return this.couponsService.update(id, updateCouponDto, user.storeId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.couponsService.remove(id, user.storeId);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validateCoupon(@Body() validateCouponDto: ValidateCouponDto, @Req() req) {
    const userId = req.user.id;
    const storeSlug = req.params.storeSlug;
    return this.couponsService.validateCoupon(validateCouponDto, userId, storeSlug);
  }
}

import { Module } from '@nestjs/common';
import { ShopCustomerService } from './shop-customer.service';
import { ShopCustomerController } from './shop-customer.controller';

@Module({
  controllers: [ShopCustomerController],
  providers: [ShopCustomerService],
  exports: [ShopCustomerService]
})
export class ShopCustomerModule { }

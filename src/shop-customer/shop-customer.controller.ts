import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ShopCustomerService } from './shop-customer.service';
import { CreateShopCustomerDto } from './dto/create-shop-customer.dto';
import { UpdateShopCustomerDto } from './dto/update-shop-customer.dto';

@Controller('shop-customer')
export class ShopCustomerController {
  constructor(private readonly shopCustomerService: ShopCustomerService) {}

  @Post()
  create(@Body() createShopCustomerDto: CreateShopCustomerDto) {
    return this.shopCustomerService.create(createShopCustomerDto);
  }

  @Get()
  findAll() {
    return this.shopCustomerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopCustomerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateShopCustomerDto: UpdateShopCustomerDto) {
    return this.shopCustomerService.update(+id, updateShopCustomerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shopCustomerService.remove(+id);
  }
}

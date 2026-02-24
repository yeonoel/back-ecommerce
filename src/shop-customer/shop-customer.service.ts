import { Injectable } from '@nestjs/common';
import { CreateShopCustomerDto } from './dto/create-shop-customer.dto';
import { UpdateShopCustomerDto } from './dto/update-shop-customer.dto';

@Injectable()
export class ShopCustomerService {
  create(createShopCustomerDto: CreateShopCustomerDto) {
    return 'This action adds a new shopCustomer';
  }

  findAll() {
    return `This action returns all shopCustomer`;
  }

  findOne(id: number) {
    return `This action returns a #${id} shopCustomer`;
  }

  update(id: number, updateShopCustomerDto: UpdateShopCustomerDto) {
    return `This action updates a #${id} shopCustomer`;
  }

  remove(id: number) {
    return `This action removes a #${id} shopCustomer`;
  }
}

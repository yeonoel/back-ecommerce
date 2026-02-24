import { PartialType } from '@nestjs/swagger';
import { CreateShopCustomerDto } from './create-shop-customer.dto';

export class UpdateShopCustomerDto extends PartialType(CreateShopCustomerDto) {}

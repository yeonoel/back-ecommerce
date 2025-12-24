import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Order } from 'src/orders/entities/order.entity';
import { Address } from './entities/address.entity';

@UseGuards(JwtAuthGuard)
@Controller('users/me/addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  create(@CurrentUser() user, @Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.create(user.id, createAddressDto);
  }

  @Get()
  findByUser(@CurrentUser() user): Promise<Address[]> {
    return this.addressesService.findByUser(user.id);
  }

 
  @Patch(':id')
  update(
    @CurrentUser() user,
    @Param('id') addressId: string,
    @Body() updateAddressDto: UpdateAddressDto) {
    return this.addressesService.updateAdress(user.id, addressId, updateAddressDto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user,
    @Param('id') adressId: string
  ) {
    return this.addressesService.removeAdress(user.id, adressId);
  }
}

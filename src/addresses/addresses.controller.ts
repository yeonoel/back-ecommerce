import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Address } from './entities/address.entity';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Addresses')
@Controller('users/me/addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  createAddress(@CurrentUser() user, @Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.createAddress(user.id, createAddressDto);
  }

  @Get()
  findByUser(@CurrentUser() user): Promise<Address[]> {
    return this.addressesService.findByUser(user.id);
  }
 
  @Patch(':id')
  updateAddress(
    @CurrentUser() user,
    @Param('id') addressId: string,
    @Body() updateAddressDto: UpdateAddressDto) {
    return this.addressesService.updateAddress(user.id, addressId, updateAddressDto);
  }

  @Delete(':id')
  removeAddress(
    @CurrentUser() user,
    @Param('id') adressId: string
  ) {
    return this.addressesService.removeAddress(user.id, adressId);
  }
}

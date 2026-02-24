import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ShopInvitationService } from './shop-invitation.service';
import { CreateShopInvitationDto } from './dto/create-shop-invitation.dto';
import { UpdateShopInvitationDto } from './dto/update-shop-invitation.dto';

@Controller('shop-invitation')
export class ShopInvitationController {
  constructor(private readonly shopInvitationService: ShopInvitationService) {}

  @Post()
  create(@Body() createShopInvitationDto: CreateShopInvitationDto) {
    return this.shopInvitationService.create(createShopInvitationDto);
  }

  @Get()
  findAll() {
    return this.shopInvitationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopInvitationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateShopInvitationDto: UpdateShopInvitationDto) {
    return this.shopInvitationService.update(+id, updateShopInvitationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shopInvitationService.remove(+id);
  }
}

import { Injectable } from '@nestjs/common';
import { CreateShopInvitationDto } from './dto/create-shop-invitation.dto';
import { UpdateShopInvitationDto } from './dto/update-shop-invitation.dto';

@Injectable()
export class ShopInvitationService {
  create(createShopInvitationDto: CreateShopInvitationDto) {
    return 'This action adds a new shopInvitation';
  }

  findAll() {
    return `This action returns all shopInvitation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} shopInvitation`;
  }

  update(id: number, updateShopInvitationDto: UpdateShopInvitationDto) {
    return `This action updates a #${id} shopInvitation`;
  }

  remove(id: number) {
    return `This action removes a #${id} shopInvitation`;
  }
}

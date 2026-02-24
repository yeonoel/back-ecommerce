import { Module } from '@nestjs/common';
import { ShopInvitationService } from './shop-invitation.service';
import { ShopInvitationController } from './shop-invitation.controller';

@Module({
  controllers: [ShopInvitationController],
  providers: [ShopInvitationService],
})
export class ShopInvitationModule {}

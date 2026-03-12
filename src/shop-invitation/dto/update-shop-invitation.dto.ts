import { PartialType } from '@nestjs/swagger';
import { CreateShopInvitationDto } from './create-shop-invitation.dto';

export class UpdateShopInvitationDto extends PartialType(CreateShopInvitationDto) {}

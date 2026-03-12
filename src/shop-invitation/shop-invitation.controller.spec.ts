import { Test, TestingModule } from '@nestjs/testing';
import { ShopInvitationController } from './shop-invitation.controller';
import { ShopInvitationService } from './shop-invitation.service';

describe('ShopInvitationController', () => {
  let controller: ShopInvitationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopInvitationController],
      providers: [ShopInvitationService],
    }).compile();

    controller = module.get<ShopInvitationController>(ShopInvitationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

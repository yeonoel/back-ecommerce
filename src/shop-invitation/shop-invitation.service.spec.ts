import { Test, TestingModule } from '@nestjs/testing';
import { ShopInvitationService } from './shop-invitation.service';

describe('ShopInvitationService', () => {
  let service: ShopInvitationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShopInvitationService],
    }).compile();

    service = module.get<ShopInvitationService>(ShopInvitationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

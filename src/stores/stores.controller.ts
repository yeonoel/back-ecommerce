import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, Req, Session } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoresService } from './stores.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.gaurds';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/enum/userRole.enum';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { SessionId } from 'src/common/decorators/session.decorator';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createStore(@Body() dto: CreateStoreDto, @CurrentUser() user: any) {
    return await this.storesService.createStoreWithInvitation(dto, user);
  }

  /**
   * Vendeur s'inscrit via son code d'invitation reçu sur WhatsApp.
   * 
   * POST /stores/onboarding
   * Public (pas de guard, le code + tempPassword servent d'auth)
   */
  @Post('onboarding')
  @HttpCode(HttpStatus.CREATED)
  async onboarding(@Body() dto: OnboardingDto, @SessionId() sessionId: string) {
    return await this.storesService.onboardVendor(dto, sessionId);
  }
}

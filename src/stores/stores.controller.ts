import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, Req, Session } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoresService } from './stores.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.gaurds';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/enum/userRole.enum';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { UpdateStoreDto } from './dto/update-store.dto';

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

  @Post("/:slugStore")
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async updateStore(@Body() dto: UpdateStoreDto, @Param('slugStore') slugStore: string) {
    return await this.storesService.updateStore(slugStore, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async getAllStores(@CurrentUser() user: any) {
    return await this.storesService.getAllStores(user);
  }

  @Delete(':slugStore')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async deleteStore(@Param('slugStore') slugStore: string) {
    return await this.storesService.deleteStore(slugStore);
  }

  /**
   * Vendeur s'inscrit via son code d'invitation reçu sur WhatsApp.
   * 
   * POST /stores/onboarding
   * Public (pas de guard, le code + tempPassword servent d'auth)
   */
  @Post('/invitation/onboarding')
  @HttpCode(HttpStatus.CREATED)
  async onboarding(@Body() dto: OnboardingDto) {
    console.log('Onboarding DTO:', dto);
    return await this.storesService.onboardVendor(dto);
  }
}

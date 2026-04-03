import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoresService } from './stores.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.gaurds';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/enum/userRole.enum';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { UpdateStoreDto } from './dto/update-store.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../common/decorators/public.decorator';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) { }

  @Post("create")
  @Public()
  @UseInterceptors(FileInterceptor('logo'))
  @HttpCode(HttpStatus.CREATED)
  async createStore(@Body() dto: CreateStoreDto, @UploadedFile() logo?: Express.Multer.File) {
    return await this.storesService.createStore(dto, logo);
  }

  @Get('/store/:slug')
  @Public()
  @HttpCode(HttpStatus.OK)
  async getStoreBySlug(@Param('slug') slug: string) {
    return await this.storesService.getStoreBySlug(slug);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SELLER)
  @HttpCode(HttpStatus.OK)
  async getMyStore(@CurrentUser() user: any) {
    return await this.storesService.getMyStore(user.id);
  }

  @Patch("/:id")
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SELLER)
  @UseInterceptors(FileInterceptor('logo'))
  @HttpCode(HttpStatus.CREATED)
  async updateStore(@UploadedFile() logo: Express.Multer.File, @Body() dto: UpdateStoreDto, @CurrentUser() user: any, @Param('id') id: string) {
    return await this.storesService.updateStore(id, dto, logo);
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.SELLER)
  @HttpCode(HttpStatus.CREATED)
  async deleteStore(@Param('slugStore') slugStore: string) {
    return await this.storesService.deleteStore(slugStore);
  }
}
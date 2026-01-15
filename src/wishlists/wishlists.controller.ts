import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Wishlist } from './entities/wishlist.entity';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('wishlists')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  addWishlist(@Body() createWishlistDto: CreateWishlistDto, @CurrentUser() user: any): Promise<Wishlist> {
    return this.wishlistsService.add(createWishlistDto, user?.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: any): Promise<Wishlist[]> {
    return this.wishlistsService.findMyWishlist(user?.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') wishlistId: string, @CurrentUser() user: any): Promise<void> {
    return this.wishlistsService.remove(user?.id, wishlistId);
  }

  @Delete('')
  clean(@CurrentUser() user: any): Promise<void> {
    return this.wishlistsService.clean(user?.id);
  }
}

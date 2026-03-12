import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CartsService } from './carts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { CreateOrAddToCartDto } from './dto/create-or-add-cart.dto';
import { UpdateCartItemDto } from '../cart-items/dto/update-cart-item.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { CartDto } from './dto/responses/cart-dto';
import { ResponseDto } from '../common/dto/responses/Response.dto';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';
import { SessionId } from '../common/decorators/session.decorator';
import { Cart } from './entities/cart.entity';
import { Public } from '../common/decorators/public.decorator';

@Controller('/:storeSlug/carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) { }

  @Get()
  @Public()
  @UseGuards(OptionalAuthGuard)
  async getCart(@CurrentUser() user: any, @SessionId() sessionId: string, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<CartDto>> {
    const cart = await this.cartsService.getOrCreateCart(user, sessionId, storeSlug);
    return {
      success: true,
      message: 'Cart retrieved successfully',
      data: cart,
    };
  }

  @Post('items')
  @Public()
  @UseGuards(OptionalAuthGuard)
  async addToCart(@SessionId() sessionId: string, @Body() createDto: CreateOrAddToCartDto, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<CartDto>> {
    const cart = await this.cartsService.addToCart(storeSlug, sessionId, createDto);
    return {
      success: true,
      message: 'Product added to cart successfully',
      data: cart,
    };
  }

  @Patch('items/:productId')
  @Public()
  @UseGuards(OptionalAuthGuard)
  async updateCartItem(@SessionId() sessionId: string, @Param('productId') productId: string, @Body() updateDto: UpdateCartItemDto, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<CartDto>> {
    const cart = await this.cartsService.updateCartProductQuantity(storeSlug, sessionId, productId, updateDto.quantity);
    return {
      success: true,
      message: 'Cart item updated successfully',
      data: cart,
    };
  }

  @Delete('items/:productId')
  @UseGuards(OptionalAuthGuard)
  @Public()
  @HttpCode(HttpStatus.OK)
  async removeFromCart(@SessionId() sessionId: string, @Param('productId') productId: string, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<CartDto>> {
    const cart = await this.cartsService.removeProductFromCart(storeSlug, sessionId, productId);
    return {
      success: true,
      message: 'Product removed from cart successfully',
      data: cart,
    };
  }

  @Delete()
  @Public()
  @UseGuards(OptionalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async clearCart(@SessionId() sessionId: string, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<null>> {
    await this.cartsService.clearCart(storeSlug, sessionId);
    return {
      success: true,
      message: 'Cart cleared successfully',
      data: null,
    };
  }

  @Post('coupon')
  @UseGuards(JwtAuthGuard)
  async applyCoupon(@CurrentUser() user: any, @Body() applyCouponDto: ApplyCouponDto, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<CartDto>> {
    const cart = await this.cartsService.applyCoupon(user.id, storeSlug, applyCouponDto.couponCode);
    return {
      success: true,
      message: 'Coupon applied successfully',
      data: cart,
    };
  }

  @Delete('coupon')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async removeCoupon(@CurrentUser() user: any, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<CartDto>> {
    const cart = await this.cartsService.removeCoupon(user.id, storeSlug);
    return {
      success: true,
      message: 'Coupon removed successfully',
      data: cart,
    };
  }

  /**
   * Fusionner le panier invité avec le panier user après connexion
   * IMPORTANT : Appelé automatiquement après login réussi
   */
  @Post('merge')
  @UseGuards(JwtAuthGuard)
  async mergeGuestCart(@CurrentUser() user: any, @SessionId() sessionId: string, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<Cart>> {
    const cart = await this.cartsService.mergeGuestCartWithUserCart(user.id, sessionId, storeSlug);
    return {
      success: true,
      message: 'Guest cart merged successfully',
      data: cart,
    };
  }
}
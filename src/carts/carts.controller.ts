import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CartsService } from './carts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { CreateOrAddToCartDto } from './dto/create-or-add-cart.dto';
import { UpdateCartItemDto } from '../cart-items/dto/update-cart-item.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { CartDto } from './dto/responses/cart-dto';
import { ResponseDto } from '../common/dto/ResponseDto';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCart(@CurrentUser() user: any): Promise<ResponseDto<CartDto>> {
    const cart = await this.cartsService.getOrCreateCart(user.id);
    return {
      success: true,
      message: 'Cart retrieved successfully',
      data: cart,
    };
  }

  
  @Post('items')
  @UseGuards(JwtAuthGuard)
  async addToCart(@CurrentUser() user: any, @Body() createDto: CreateOrAddToCartDto): Promise<ResponseDto<CartDto>> {
    const cart = await this.cartsService.addToCart(user.id, createDto);
    return {
      success: true,
      message: 'Product added to cart successfully',
      data: cart,
    };
  }

  /**
   * Modifier la quantité d'un item
   */
  @Patch('items/:itemId')
  @UseGuards(JwtAuthGuard)
  async updateCartItem(@CurrentUser() user: any, @Param('itemId') itemId: string, @Body() updateDto: UpdateCartItemDto): Promise<ResponseDto<CartDto>> {
    const cart = await this.cartsService.updateCartItem(user.id, itemId, updateDto.quantity);
    return {
      success: true,
      message: 'Cart item updated successfully',
      data: cart,
    };
  }

  /**
   * Retirer un produit du panier
   */
  @Delete('items/:itemId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async removeFromCart(@CurrentUser() user: any, @Param('itemId') itemId: string): Promise<ResponseDto<CartDto>> {
    const cart = await this.cartsService.removeFromCart(user.id, itemId);
    return {
      success: true,
      message: 'Product removed from cart successfully',
      data: cart,
    };
  }

  /**
   * Vider le panier
   */
  @Delete()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async clearCart(@CurrentUser() user: any): Promise<ResponseDto<null>> {
    await this.cartsService.clearCart(user.id);
    return {
      success: true,
      message: 'Cart cleared successfully',
      data: null,
    };
  }

  /**
   * Appliquer un code promo
   */
  @Post('coupon')
  @UseGuards(JwtAuthGuard)
  async applyCoupon(@CurrentUser() user: any, @Body() applyCouponDto: ApplyCouponDto,): Promise<ResponseDto<CartDto>> {
    const cart = await this.cartsService.applyCoupon(user.id, applyCouponDto.couponCode);
    return {
      success: true,
      message: 'Coupon applied successfully',
      data: cart,
    };
  }

  /**
   * DELETE /api/v1/cart/coupon
   * Retirer le code promo
   */
  @Delete('coupon')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async removeCoupon(@CurrentUser() user: any): Promise<ResponseDto<CartDto>> {
    const cart = await this.cartsService.removeCoupon(user);
    return {
      success: true,
      message: 'Coupon removed successfully',
      data: cart,
    };
  }
}
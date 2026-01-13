import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { DataSource, Repository } from 'typeorm';
import { CartItem } from '../cart-items/entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from 'src/product-variants/entities/product-variant.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { CartDto } from './dto/responses/cart-dto';
import { CreateOrAddToCartDto } from './dto/create-or-add-cart.dto';
import { mapToCartDto } from './mapper/map-to-cart-dto';
import { BusinessConstants } from 'src/common/constants/businness.constant';
import { CalculationHelper } from 'src/common/helpers/calculation.helper';


@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartsRepository: Repository<Cart>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Récupérer ou créer le panier d'un utilisateur connecté
   */
  async getOrCreateCart(userId: string): Promise<CartDto> {
    let cart = await this.cartsRepository.findOne({
      where: { 
        user: { id: userId }
       },
      relations: ['items', 'items.product', 'items.product.images', 'items.variant'],
    });
    const user = await this.dataSource.getRepository('User').findOne({where: {id: userId}});
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!cart) {
      cart = await this.cartsRepository.save({
        user,
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        discountAmount: 0,
        total: 0,
      });
    }
    return mapToCartDto(cart);
  }

  /**
   * Ajouter un produit au panier
   */
  async addToCart(userId: string, createDto: CreateOrAddToCartDto): Promise<CartDto> {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne('User', {where: {id: userId}});
        if (!user) {
          throw new NotFoundException('User not found');
        }
      // Vérifier que le produit existe et est actif
      const product = await manager.findOne(Product, {
        where: { id: createDto.productId, isActive: true },
        relations: ['images'],
      });
      if (!product) {
        throw new NotFoundException('Product not found or inactive');
      }
      // Vérifier le stock disponible
      let availableStock: number;
      let variant : ProductVariant | null = null;
      if (createDto.variantId) {
        variant = await manager.findOne(ProductVariant, {where: { id: createDto.variantId, isActive: true }});
        if (!variant) {
          throw new NotFoundException('Variant not found or inactive');
        }

        availableStock = variant.stockQuantity;
      } else {
        availableStock = product.stockQuantity;
      }
      
      if (availableStock < createDto.quantity) {
        throw new BadRequestException(`Not enough stock. Only ${availableStock} items available`);
      }
      //Récupérer ou créer le panier
      let cart = await manager.findOne(Cart, {where: { user: {id: userId} }});
      if (!cart) {
        cart = await manager.save(Cart, {
          user,
          subtotal: 0,
          tax: 0,
          shippingCost: 0,
          discountAmount: 0,
          total: 0,
        });
      }

      // Vérifier si le produit est déjà dans le panier
      const existingCartItem = await manager.findOne(CartItem, {
        where: {
          cart: { id: cart.id },
          product: { id: createDto.productId },
          variant: { id: createDto.variantId },
        },
      });

      if (existingCartItem) {
        // Vérifier le stock pour la nouvelle quantité totale
        const newTotalQuantity = existingCartItem.quantity + createDto.quantity;
        if (availableStock < newTotalQuantity) {
          throw new BadRequestException(
            `Not enough stock. You have ${existingCartItem.quantity} in cart. Only ${availableStock} items available`,
          );
        }
        // Mettre à jour la quantité
        existingCartItem.quantity = newTotalQuantity;
        await manager.save(CartItem, existingCartItem);
      } else {
        // Créer un nouvel item
        const price = variant?.price || product.price;
        if (!variant) { 
          throw new NotFoundException('Variant not found');
         }
        await manager.save(CartItem, {
          cart: cart,
          product: product,
          variant: variant,
          quantity: createDto.quantity,
          price,
        });
      }
      // 5. Recalculer les totaux
      await this.recalculateTotals(cart.id, manager);
      // 6. Retourner le panier mis à jour
      const updatedCart = await manager.findOne(Cart, {
        where: { id: cart.id },
        relations: ['items', 'items.product', 'items.product.images', 'items.variant'],
      });
      if (!updatedCart) {
        throw new NotFoundException('Cart not found after update');
      }
      return mapToCartDto(updatedCart);
    });
  }

  
  async updateCartItem(userId: string, itemId: string, quantity: number): Promise<CartDto> {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne('User', {where: {id: userId}});
        if (!user) {
          throw new NotFoundException('User not found');
        }
      // 1. Récupérer le cart item
      const cartItem = await manager.findOne(CartItem, {
        where: { id: itemId },
        relations: ['cart.user', 'product', 'variant', ],
      });
      if (!cartItem) {
        throw new NotFoundException('Cart item not found');
      }
      if (cartItem.cart.user?.id !== userId) {
        throw new BadRequestException('This cart item does not belong to you');
      }
      if (quantity === 0) {
        await manager.delete(CartItem, { id: itemId });
        await this.recalculateTotals(cartItem.cart.id, manager);
        const updatedCart = await manager.findOne(Cart, {
          where: { id: cartItem.cart.id },
          relations: ['items', 'items.product', 'items.product.images', 'items.variant'],
        });
        if (!updatedCart) {
          throw new NotFoundException('Cart not found after update');
        }
        return mapToCartDto(updatedCart);
      }

      // 3. Vérifier le stock
      const availableStock = cartItem.variant?.id ? cartItem.variant.stockQuantity : cartItem.product.stockQuantity;

      if (availableStock < quantity) {
        throw new BadRequestException(`Not enough stock. Only ${availableStock} items available`);
      }
      // 4. Mettre à jour la quantité
      cartItem.quantity = quantity;
      await manager.save(CartItem, cartItem);

      // 5. Recalculer les totaux
      await this.recalculateTotals(cartItem.cart.id, manager);

      // 6. Retourner le panier mis à jour
      const updatedCart = await manager.findOne(Cart, {
        where: { id: cartItem.cart.id },
        relations: ['items', 'items.product', 'items.product.images', 'items.variant'],
      });
      if (!updatedCart) {
        throw new NotFoundException('Cart not found after update');
      }

      return mapToCartDto(updatedCart);
    });
  }

  /**
   * Retirer un produit du panier
   */
  async removeFromCart(userId: string, itemId: string): Promise<CartDto> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Récupérer le cart item
      const cartItem = await manager.findOne(CartItem, {
        where: { id: itemId },
        relations: ['cart.user'],
      });

      if (!cartItem) {
        throw new NotFoundException('Cart item not found');
      }

      // Vérifier que l'item appartient au user
      if (cartItem.cart.user?.id !== userId) {
        throw new BadRequestException('This cart item does not belong to you');
      }

      const cartId = cartItem.cart.id;
      // Supprimer l'item
      await manager.delete(CartItem, { id: itemId });
      // Recalculer les totaux
      await this.recalculateTotals(cartId, manager);
      // Retourner le panier mis à jour
      const updatedCart = await manager.findOne(Cart, {
        where: { id: cartId },
        relations: ['items', 'items.product', 'items.product.images', 'items.variant'],
      });
      if (!updatedCart) {
        throw new NotFoundException('Cart not found after update');
      }
      return mapToCartDto(updatedCart);
    });
  }

  
  async clearCart(userId: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
      });
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }
      await manager.delete(CartItem, { cartId: cart.id });
      cart.subtotal = 0;
      cart.tax = 0;
      cart.shippingCost = 0;
      cart.discountAmount = 0;
      cart.total = 0;
      cart.couponCode = '';

      await manager.save(Cart, cart);
    });
  }

  async applyCoupon(userId: string, couponCode: string): Promise<CartDto> {
    return this.dataSource.transaction(async (manager) => {
      // Récupérer le panier
      const cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: ['items'],
      });
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }
      if (cart.items.length === 0) {
        throw new BadRequestException('Cannot apply coupon to empty cart');
      }
      // Vérifier le coupon
      const coupon = await manager.findOne(Coupon, {
        where: { code: couponCode.toUpperCase(), isActive: true },
      });
      if (!coupon) {
        throw new NotFoundException('Invalid or inactive coupon code');
      }
      // Valider le coupon
      const now = new Date();
      if (coupon.validFrom && now < coupon.validFrom) {
        throw new BadRequestException('Coupon not yet valid');
      }

      if (coupon.validUntil && now > coupon.validUntil) {
        throw new BadRequestException('Coupon has expired');
      }

      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        throw new BadRequestException('Coupon usage limit reached');
      }
      // Vérifier montant minimum
      if (coupon.minPurchaseAmount && cart.subtotal < coupon.minPurchaseAmount) {
        throw new BadRequestException(`Minimum purchase amount is ${coupon.minPurchaseAmount}`);
      }

      // TODO: Vérifier usage_limit_per_user (nécessite table coupon_usage)

      // Appliquer le coupon
      cart.couponCode = coupon.code;
      await manager.save(Cart, cart);
      // Recalculer les totaux avec réduction
      await this.recalculateTotals(cart.id, manager);
      // Retourner le panier mis à jour
      const updatedCart = await manager.findOne(Cart, {
        where: { id: cart.id },
        relations: ['items', 'items.product', 'items.product.images', 'items.variant'],
      });
      if (!updatedCart) {
        throw new NotFoundException('Cart not found after update');
      }

      return mapToCartDto(updatedCart);
    });
  }

  /**
   * Retirer le code promo
   */
  async removeCoupon(userId: string): Promise<CartDto> {
    return this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(Cart, {where: { user: { id: userId } }});
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }
      cart.couponCode = '';
      await manager.save(Cart, cart);
      // Recalculer sans réduction
      await this.recalculateTotals(cart.id, manager);
      const updatedCart = await manager.findOne(Cart, {
        where: { id: cart.id },
        relations: ['items', 'items.product', 'items.product.images', 'items.variant'],
      });
      if (!updatedCart) {
        throw new NotFoundException('Cart not found after update');
      }
      return mapToCartDto(updatedCart);
    });
  }

  /**
   * Recalculer les totaux du panier
   */
  private async recalculateTotals(cartId: string, manager: any,): Promise<void> {
    const cart = await manager.findOne(Cart, {where: { id: cartId }, relations: ['items']});
    // Calculer le subtotal
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
    // Calculer la taxe (20% TVA)
    const tax = CalculationHelper.calculateTax(subtotal, BusinessConstants.TAX.RATE);
    // Frais de port (gratuit si > 50€, sinon 5.99€)
    const shippingCost = CalculationHelper.calculateShipping(subtotal);
    // Calculer la réduction si coupon
    let discountAmount = 0;
    if (cart.couponCode) {
      const coupon = await manager.findOne(Coupon, {where: { code: cart.couponCode }});
      if (coupon) {
        if (coupon.discountType === 'percentage') {
          discountAmount =  CalculationHelper.applyDiscount(subtotal, coupon.discountValue);
          if (coupon.maxDiscountAmount) {
            discountAmount = CalculationHelper.returnMinValue(coupon.discountValue, subtotal);
          }
        } else {
          discountAmount = CalculationHelper.returnMinValue(coupon.discountValue, subtotal);
        }
      }
    }
    // 5. Calculer le total
    const total = CalculationHelper.calculateCartTotal(subtotal, tax, shippingCost, discountAmount);
    // 6. Mettre à jour le panier
    cart.subtotal = CalculationHelper.roundToTwoDecimals(subtotal);
    cart.tax = CalculationHelper.roundToTwoDecimals(tax);
    cart.shippingCost = CalculationHelper.roundToTwoDecimals(shippingCost);
    cart.discountAmount = CalculationHelper.roundToTwoDecimals(discountAmount);
    cart.total = CalculationHelper.roundToTwoDecimals(total);

    await manager.save(Cart, cart);
  }
}

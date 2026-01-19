import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { DataSource, IsNull, Repository } from 'typeorm';
import { CartItem } from '../cart-items/entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from 'src/product-variants/entities/product-variant.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { CartDto } from './dto/responses/cart-dto';
import { CreateOrAddToCartDto } from './dto/create-or-add-cart.dto';
import { mapToCartDto } from './mapper/map-to-cart-dto';
import { BusinessConstants } from '../common/constants/businness.constant';
import { CalculationHelper } from '../common/helpers/calculation.helper';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartsRepository: Repository<Cart>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Récupérer ou créer le panier d'un utilisateur connecté ou d'un invité
   * @param sessionId Id de session de l'invité
   * @param userId Id de l'utilisateur
   * @return Le panier
   */
  async getOrCreateCart(userId: string | null, sessionId: string): Promise<CartDto> {
    let cart: Cart | null = null;
    if (userId) {
      cart = await this.cartsRepository.findOne({
        where: { user: { id: userId } },
        relations: ['items', 'items.product', 'items.product.images', 'items.variant'],
      });
      if (cart && cart.items.length > 0) {
        return mapToCartDto(cart);
      }
      const guestCart = await this.cartsRepository.findOne({
        where: { sessionId, user: IsNull() },
        relations: ['items'],
      });
      if (guestCart && guestCart.items.length > 0) {
        // Fusionner le panier invité
        cart = await this.mergeGuestCartWithUserCart(userId, sessionId);
        return mapToCartDto(cart);
      }
      const user = await this.dataSource.getRepository('User').findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      // Créer un nouveau panier utilisateur
      cart = await this.cartsRepository.save({
        user,
        sessionId: null,
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        discountAmount: 0,
        total: 0,
      });
    } else {
      cart = await this.cartsRepository.findOne({
        where: { sessionId, user: IsNull() },
        relations: ['items', 'items.product', 'items.product.images', 'items.variant'],
      });

      if (cart) {
        return mapToCartDto(cart);
      }
      // Créer un panier invité
      cart = await this.cartsRepository.save({
        user: null,
        sessionId,
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
   * @param userId Id de l'utilisateur
   * @param sessionId Id de session de l'invité
   * @param createDto Dto avec les infos du produit à ajouter
   * @return Le panier mis à jour
   */
  async addToCart(userId: string | null,sessionId: string, createDto: CreateOrAddToCartDto): Promise<CartDto> {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: createDto.productId, isActive: true },
        relations: ['images'],
      });
      if (!product) {
        throw new NotFoundException('Product not found or inactive');
      }
      // Vérifier le stock
      let availableStock: number;
      let variant: ProductVariant | null = null;
      if (createDto.variantId) {
        variant = await manager.findOne(ProductVariant, {
          where: { id: createDto.variantId, isActive: true },
        });
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
      // Récupérer ou créer le panier
      let cart: Cart | null = null;
      if (userId) {
        // user connecté
        const user = await manager.findOne('User', { where: { id: userId } });
        if (!user) {
          throw new NotFoundException('User not found');
        }
        cart = await manager.findOne(Cart, {where: { user: { id: userId } }});
        if (!cart) {
          cart = await manager.save(Cart, {
            user,
            sessionId: null,
            subtotal: 0,
            tax: 0,
            shippingCost: 0,
            discountAmount: 0,
            total: 0,
          });
        }
      } else {
        // Invité
        cart = await manager.findOne(Cart, {where: { sessionId, user: IsNull() }});
        if (!cart) {
          cart = await manager.save(Cart, {
            user: null,
            sessionId,
            subtotal: 0,
            tax: 0,
            shippingCost: 0,
            discountAmount: 0,
            total: 0,
          });
        }
      }
      // Vérifier si le produit est déjà dans le panier
      const whereClause: any = {
        cart: { id: cart.id },
        product: { id: createDto.productId },
      };
      if (createDto.variantId) {
        whereClause.variant = { id: createDto.variantId };
      } else {
        whereClause.variant = IsNull();
      }
      const existingCartItem = await manager.findOne(CartItem, {where: whereClause});
      if (existingCartItem) {
        const newTotalQuantity = existingCartItem.quantity + createDto.quantity;
        if (availableStock < newTotalQuantity) {
          throw new BadRequestException(
            `Not enough stock. You have ${existingCartItem.quantity} in cart. Only ${availableStock} items available`,
          );
        }
        existingCartItem.quantity = newTotalQuantity;
        await manager.save(CartItem, existingCartItem);
      } else {
        const price = variant?.price || product.price;
        await manager.save(CartItem, {cart, product, variant, quantity: createDto.quantity, price});
      }
      // Recalculer les totaux
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
   * Modifier la quantité d'un item
   * @param userId Id de l'utilisateur
   * @param itemId Id de l'item à modifier dans le panier
   * @param quantity Nouvelle quantité de l'item
   * @return Le panier mis à jour
   */
  async updateCartItem(userId: string | null, sessionId: string, itemId: string, quantity: number): Promise<CartDto> {
    return this.dataSource.transaction(async (manager) => {
      const cartItem = await manager.findOne(CartItem, {
        where: { id: itemId },
        relations: ['cart', 'cart.user', 'product', 'variant'],
      });
      if (!cartItem) {
        throw new NotFoundException('Cart item not found');
      }
      // Vérifier ownership
      if (userId) {
        if (cartItem.cart.user?.id !== userId) {
          throw new BadRequestException('This cart item does not belong to you');
        }
      } else {
        if (cartItem.cart.sessionId !== sessionId) {
          throw new BadRequestException('This cart item does not belong to you');
        }
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
      const availableStock = cartItem.variant ? cartItem.variant.stockQuantity : cartItem.product.stockQuantity;
      if (availableStock < quantity) {
        throw new BadRequestException(`Not enough stock. Only ${availableStock} items available`);
      }
      cartItem.quantity = quantity;
      await manager.save(CartItem, cartItem);
      await this.recalculateTotals(cartItem.cart.id, manager);
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
   * Fusionner le panier invité avec le panier utilisateur
   * Appelé automatiquement après login
   * @param userId Id de l'utilisateur
   * @param sessionId Id du panier invité
   * @return Le panier fusionné
   */
  async mergeGuestCartWithUserCart(userId: string, sessionId: string): Promise<Cart> {
  return this.dataSource.transaction(async (manager) => {
    // Récupérer le panier invité
    const guestCart = await manager.findOne(Cart, {
      where: { sessionId, user: IsNull() },
      relations: ['items', 'items.product', 'items.variant'],
    });
    const user = await manager.findOne('User', { where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Si pas de panier invité ou panier vide
    if (!guestCart || guestCart.items.length === 0) {
      // Vérifier s'il existe déjà un panier user
      const existingUserCart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: ['items', 'items.product', 'items.product.images', 'items.variant'],
      });

      if (existingUserCart) {
        return existingUserCart;
      }
      return await manager.save(Cart, {
        user,
        sessionId: null,
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        discountAmount: 0,
        total: 0,
      });
    }
    // Récupérer ou créer le panier user
    let userCart = await manager.findOne(Cart, {
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'items.variant'],
    });
    if (!userCart) {
      userCart = await manager.save(Cart, {
        user,
        sessionId: null,
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        discountAmount: 0,
        total: 0,
      });
    }
    // Fusionner les items
    for (const guestItem of guestCart.items) {
      let availableStock: number;
      if (guestItem.variant) {
        const currentVariant = await manager.findOne(ProductVariant, {
          where: { id: guestItem.variant.id },
        });
        if (!currentVariant || !currentVariant.isActive) {
          console.warn(`Variant ${guestItem.variant.id} no longer available, skipping`);
          continue;
        }
        availableStock = currentVariant.stockQuantity;
      } else {
        const currentProduct = await manager.findOne(Product, {
          where: { id: guestItem.product.id },
        });
        if (!currentProduct || !currentProduct.isActive) {
          console.warn(`Product ${guestItem.product.id} no longer available, skipping`);
          continue;
        }
        availableStock = currentProduct.stockQuantity;
      }
      // Vérifier si cet item existe déjà dans le panier user
      const whereClause: any = {
        cart: { id: userCart.id },
        product: { id: guestItem.product.id },
      };

      if (guestItem.variant) {
        whereClause.variant = { id: guestItem.variant.id };
      } else {
        whereClause.variant = IsNull();
      }
      const existingUserItem = await manager.findOne(CartItem, {
        where: whereClause,
      });
      if (existingUserItem) {
        const newQuantity = existingUserItem.quantity + guestItem.quantity;
        if (newQuantity > availableStock) {
          existingUserItem.quantity = availableStock;
          console.warn(
            `Not enough stock for product ${guestItem.product.id}. ` +
            `Requested: ${newQuantity}, Available: ${availableStock}. ` +
            `Adjusted to ${availableStock}.`
          );
        } else {
          existingUserItem.quantity = newQuantity;
        }
        await manager.save(CartItem, existingUserItem);
      } else {
        // Nouvel item, transférer au panier user
        if (guestItem.quantity > availableStock) {
          guestItem.quantity = availableStock;
          console.warn(
            `Not enough stock for product ${guestItem.product.id}. ` +
            `Adjusted quantity from ${guestItem.quantity} to ${availableStock}.`
          );
        }
        guestItem.cart = userCart;
        await manager.save(CartItem, guestItem);
      }
    }
    // Supprimer le panier invité
    await manager.delete(Cart, { id: guestCart.id });
    // Recalculer les totaux
    await this.recalculateTotals(userCart.id, manager);
    // Retourner le panier fusionné avec toutes les relations
    const updatedCart = await manager.findOne(Cart, {
      where: { id: userCart.id },
      relations: ['items', 'items.product', 'items.product.images', 'items.variant'],
    });
    if (!updatedCart) {
      throw new NotFoundException('Cart not found after merge');
    }
    return updatedCart;
  });
  }

  /**
   * Retirer un produit du panier
   * @param userId Id de l'utilisateur
   * @param sessionId Id de session de l'invité
   * @param itemId Id de l'item à retirer dans le panier
   * @return Le panier mis à jour
   */
  async removeFromCart(userId: string | null, sessionId: string, itemId: string): Promise<CartDto> {
    return this.dataSource.transaction(async (manager) => {
      const cartItem = await manager.findOne(CartItem, {where: { id: itemId },relations: ['cart', 'cart.user']});
      if (!cartItem) {
        throw new NotFoundException('Cart item not found');
      }
      // Vérifier ownership
      if (userId) {
        if (cartItem.cart.user?.id !== userId) {
          throw new BadRequestException('This cart item does not belong to you');
        }
      }
      if (cartItem.cart.sessionId !== sessionId) {
        throw new BadRequestException('This cart item does not belong to you');
      }
      const cartId = cartItem.cart.id;
      await manager.delete(CartItem, { id: itemId });
      await this.recalculateTotals(cartId, manager);
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
  
   /**
    * Vider le panier
    * @param userId  Id de l'utilisateur
    * @param sessionId Id de session de l'invité
    * @return void
    */
   async clearCart(userId: string | null, sessionId: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      let cart: Cart | null = null;
      if (userId) {
        cart = await manager.findOne(Cart, {where: { user: { id: userId } }});
      } else {
        cart = await manager.findOne(Cart, {where: { sessionId, user: IsNull() }});
      }
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }
      await manager.delete(CartItem, { cart: { id: cart.id } });
      cart.subtotal = 0;
      cart.tax = 0;
      cart.shippingCost = 0;
      cart.discountAmount = 0;
      cart.total = 0;
      cart.couponCode = null;

      await manager.save(Cart, cart);
    });
  }

    /**
     * Appliquer un code promo
     * @param userId Id de l'utilisateur
     * @param couponCode Code promo à appliquer
     * @return Le panier mis à jour
     */
  async applyCoupon(userId: string, couponCode: string): Promise<CartDto> {
    return this.dataSource.transaction(async (manager) => {
      // Récupérer le panier
      const cart = await manager.findOne(Cart, {where: { user: { id: userId } },relations: ['items']});
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }
      if (cart.items.length === 0) {
        throw new BadRequestException('Cannot apply coupon to empty cart');
      }
      // Vérifier le coupon
      const coupon = await manager.findOne(Coupon, {where: { code: couponCode.toUpperCase(), isActive: true }});
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
   * @param userId Id de l'utilisateur
   * @return Le panier mis à jour
   */
  async removeCoupon(userId: string): Promise<CartDto> {
    return this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(Cart, {where: { user: { id: userId } }});
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }
      cart.couponCode = null;
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
   * @param cartId Id du panier
   * @param manager EntityManager de la transaction
   * @return void
   */
  private async recalculateTotals(cartId: string, manager: any,): Promise<void> {
    const cart = await manager.findOne(Cart, {where: { id: cartId }, relations: ['items']});
    // Calculer le subtotal
    const subtotal = cart.items.reduce((sum, item) => {return sum + item.price * item.quantity}, 0);
    // Calculer la taxe (20% TVA)
    const tax = CalculationHelper.calculateTax(subtotal, BusinessConstants.TAX.RATE);
    const shippingCost = CalculationHelper.calculateShipping(subtotal);
    // Calculer la réduction si coupon
    // les coupons sont ajoutés dans la table coupons.
    // Le coupon est ajouté lorsque le client renseigne le champ code promo depuis le frontend
    // ce dernier est verifié et stocké dans le champ couponCode de la table carts.
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
    // Calculer le total
    const total = CalculationHelper.calculateCartTotal(subtotal, tax, shippingCost, discountAmount);
    // Mettre à jour le panier
    cart.subtotal = CalculationHelper.roundToTwoDecimals(subtotal);
    cart.tax = CalculationHelper.roundToTwoDecimals(tax);
    cart.shippingCost = CalculationHelper.roundToTwoDecimals(shippingCost);
    cart.discountAmount = CalculationHelper.roundToTwoDecimals(discountAmount);
    cart.total = CalculationHelper.roundToTwoDecimals(total);

    await manager.save(Cart, cart);
  }
}

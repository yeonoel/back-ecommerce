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
import { CouponsService } from '../coupons/coupons.service';
import { ValidateCouponResponseDto } from '../coupons/dto/responses/validate-coupon-response.dto';
import { Store } from '../stores/entities/store.entity';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/enum/userRole.enum';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartsRepository: Repository<Cart>,
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
    private readonly dataSource: DataSource,
    private readonly couponsService: CouponsService
  ) { }

  /**
   * Récupérer ou créer le panier d'un utilisateur connecté ou d'un invité
   * @param sessionId Id de session de l'invité
   * @param userId Id de l'utilisateur
   * @return Le panier
   */
  async getOrCreateCart(user: User | null, sessionId: string, storeSlug: string): Promise<CartDto> {
    let cart: Cart | null = null;
    const store = await this.storesRepository.findOne({ where: { slug: storeSlug } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    const userId = user?.role === UserRole.CUSTOMER ? user.id : null;
    if (userId) {
      cart = await this.cartsRepository.findOne({
        where: { user: { id: userId }, store: { slug: storeSlug } },
        relations: ['items', 'items.product', 'items.product.images', 'items.variant'],
      });
      if (cart && cart.items.length > 0) {
        return mapToCartDto(cart);
      }
      const guestCart = await this.cartsRepository.findOne({
        where: { sessionId, user: IsNull(), store: { slug: storeSlug } },
        relations: ['items'],
      });
      if (guestCart && guestCart.items.length > 0) {
        // Fusionner le panier invité
        cart = await this.mergeGuestCartWithUserCart(userId, sessionId, storeSlug);
        return mapToCartDto(cart);
      }
      const user = await this.dataSource.getRepository('User').findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      // Créer un nouveau panier utilisateur
      cart = await this.cartsRepository.save({
        user,
        store,
        sessionId: null,
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        discountAmount: 0,
        total: 0,
      });
    } else {
      cart = await this.cartsRepository.findOne({
        where: { sessionId, user: IsNull(), store: { slug: storeSlug } },
        relations: ['items', 'items.product', 'items.product.images', 'items.variant'],
      });

      if (cart) {
        return mapToCartDto(cart);
      }
      // Créer un panier invité
      cart = await this.cartsRepository.save({
        user: null,
        store,
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
  async addToCart(storeSlug: string, sessionId: string, createDto: CreateOrAddToCartDto): Promise<CartDto> {
    return this.dataSource.transaction(async (manager) => {
      const store = await manager.findOne(Store, { where: { slug: storeSlug } });
      if (!store) {
        throw new NotFoundException('Store not found');
      }
      const product = await manager.findOne(Product, {
        where: { id: createDto.productId, store: { slug: storeSlug }, isActive: true },
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
          where: { id: createDto.variantId, product: { id: product.id }, isActive: true },
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
      // Invité
      cart = await manager.findOne(Cart, { where: { sessionId, user: IsNull(), store: { slug: storeSlug } } });
      if (!cart) {
        cart = await manager.save(Cart, {
          user: null,
          store,
          sessionId,
          subtotal: 0,
          tax: 0,
          shippingCost: 0,
          discountAmount: 0,
          total: 0,
        });
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
      const existingCartItem = await manager.findOne(CartItem, { where: whereClause });
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
        await manager.save(CartItem, { cart, product, variant, quantity: createDto.quantity, price });
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
  * Retirer un produit du panier
  * @param userId Id de l'utilisateur
  * @param sessionId Id de session de l'invité
  * @param itemId Id de l'item à retirer dans le panier
  * @return Le panier mis à jour
  */
  async removeProductFromCart(storeSlug: string, sessionId: string, productId: string): Promise<CartDto> {
    return this.dataSource.transaction(async (manager) => {
      const store = await manager.findOne(Store, { where: { slug: storeSlug } });
      if (!store) {
        throw new NotFoundException('Store not found');
      }
      const cart = await manager.findOne(Cart, { where: { sessionId, user: IsNull(), store: { slug: storeSlug } } });
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }
      const cartItem = await manager.findOne(CartItem, { where: { cart: { id: cart.id }, product: { id: productId } } });
      if (!cartItem) {
        throw new NotFoundException('Cart item not found');
      }
      await manager.delete(CartItem, { id: cartItem.id });
      await this.recalculateTotals(cart.id, manager);
      const updatedCart = await manager.findOne(Cart, {
        where: { id: cart.id, store: { slug: storeSlug } },
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
  async updateCartProductQuantity(storeSlug: string, sessionId: string, productId: string, quantity: number): Promise<CartDto> {
    return this.dataSource.transaction(async (manager) => {
      if (quantity < 0) {
        throw new BadRequestException('Quantity must be greater or equal to 0');
      }
      const store = await manager.findOne(Store, { where: { slug: storeSlug } });
      if (!store) {
        throw new NotFoundException('Store not found');
      }
      const storeId = store.id;
      const cart = await manager.findOne(Cart, { where: { store: { id: storeId }, sessionId } });
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }
      const cartItem = await manager.findOne(CartItem, {
        where: { product: { id: productId }, cart: { id: cart.id } },
        relations: ['cart.store', 'cart.user', 'product', 'variant'],
      });
      if (!cartItem) {
        throw new NotFoundException('Cart item not found');
      }

      if (quantity === 0) {
        await manager.delete(CartItem, { id: cartItem.id });
        await this.recalculateTotals(cartItem.cart.id, manager);
        const updatedCart = await manager.findOne(Cart, {
          where: { id: cartItem.cart.id, store },
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
        where: { id: cartItem.cart.id, store: { id: storeId } },
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
  async clearCart(storeSlug: string, sessionId: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const store = await manager.findOne(Store, { where: { slug: storeSlug } });
      if (!store) {
        throw new NotFoundException('Store not found');
      }
      let cart: Cart | null = null;
      cart = await manager.findOne(Cart, { where: { sessionId, user: IsNull(), store: { slug: storeSlug } } });
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }
      await manager.delete(CartItem, { cart: { id: cart.id } });
      cart.subtotal = 0;
      cart.store = store;
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
  async applyCoupon(userId: string, storeSlug: string, couponCode: string): Promise<CartDto> {
    return this.dataSource.transaction(async (manager) => {
      // Récupérer le panier
      const cart = await manager.findOne(Cart, { where: { user: { id: userId }, store: { slug: storeSlug } }, relations: ['items'] }); // { where: { user: { id: userId }, store: { id: storeId } }, relations: ['items'] });
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }
      if (cart.items.length === 0) {
        throw new BadRequestException('Cannot apply coupon to empty cart');
      }
      // Vérifier le coupon
      const coupon = await manager.findOne(Coupon, { where: { code: couponCode.toUpperCase(), store: { slug: storeSlug }, isActive: true } });
      if (!coupon) {
        throw new NotFoundException('Invalid or inactive coupon code');
      }
      // Valider le coupon
      const data: ValidateCouponResponseDto =
        await this.couponsService.validateCoupon({ code: coupon.code, cartSousTotal: cart.subtotal }, userId, storeSlug);
      if (!data.isValid) {
        throw new BadRequestException(data.message);
      }
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
  async removeCoupon(userId: string, storeId: string): Promise<CartDto> {
    return this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(Cart, { where: { user: { id: userId }, store: { id: storeId } } });
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
  private async recalculateTotals(cartId: string, manager: any): Promise<void> {
    const cart = await manager.findOne(Cart, { where: { id: cartId }, relations: ['items'] });
    // Calculer le subtotal
    let subtotal = cart.items.reduce((sum, item) => { return sum + item.price * item.quantity }, 0);
    // Calculer la taxe (20% TVA)
    const tax = CalculationHelper.calculateTax(subtotal, BusinessConstants.TAX.RATE);
    const shippingCost = CalculationHelper.calculateShipping(subtotal);
    // Calculer la réduction si coupon
    // les coupons sont ajoutés dans la table coupons.
    // Le coupon est ajouté lorsque le client renseigne le champ code promo depuis le frontend dans le panier
    // ce dernier est verifié et stocké dans le champ couponCode de la table carts.
    let discountAmount = 0;
    let subTotalAfterDiscount = subtotal;
    if (cart.couponCode) {
      const coupon = await manager.findOne(Coupon, { where: { code: cart.couponCode } });
      if (coupon) {
        discountAmount = this.couponsService.calculateDiscount(coupon, subtotal);
      }
      subTotalAfterDiscount -= discountAmount;
    }
    // Calculer le total
    const total = CalculationHelper.calculateCartTotal(subtotal, tax, shippingCost, discountAmount);
    // Mettre à jour le panier
    cart.subtotal = CalculationHelper.roundToTwoDecimals(subTotalAfterDiscount);
    cart.tax = CalculationHelper.roundToTwoDecimals(tax);
    cart.shippingCost = CalculationHelper.roundToTwoDecimals(shippingCost);
    cart.discountAmount = CalculationHelper.roundToTwoDecimals(discountAmount);
    cart.total = CalculationHelper.roundToTwoDecimals(total);

    await manager.save(Cart, cart);
  }

  /**
   * Fusionner le panier invité avec le panier utilisateur
   * Appelé automatiquement après login
   * @param userId Id de l'utilisateur
   * @param sessionId Id du panier invité
   * @return Le panier fusionné
   */
  async mergeGuestCartWithUserCart(userId: string, sessionId: string, storeSlug: string): Promise<Cart> {
    return this.dataSource.transaction(async (manager) => {
      const store = await manager.findOne(Store, { where: { slug: storeSlug } });
      if (!store) {
        throw new NotFoundException('Store not found');
      }
      // Récupérer le panier invité
      const guestCart = await manager.findOne(Cart, {
        where: { sessionId, user: IsNull(), store: { slug: storeSlug } },
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
          where: { user: { id: userId }, store: { slug: storeSlug } },
          relations: ['items', 'items.product', 'items.product.images', 'items.variant'],
        });

        if (existingUserCart) {
          return existingUserCart;
        }
        return await manager.save(Cart, {
          user,
          store,
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
        where: { user: { id: userId }, store: { slug: storeSlug } },
        relations: ['items', 'items.product', 'items.variant'],
      });
      if (!userCart) {
        userCart = await manager.save(Cart, {
          user,
          store,
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
}

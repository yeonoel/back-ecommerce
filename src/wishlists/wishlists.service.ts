import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { Repository } from 'typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../product-variants/entities/product-variant.entity';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistsRepository: Repository<Wishlist>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantsRepository: Repository<ProductVariant>,

  ) {}

  /**
   * 
   * @param createWishlistDto 
   * @param userId 
   * @return le produit ajouté
   */
  async add(createWishlistDto: CreateWishlistDto, userId: string): Promise<Wishlist> {
    const { productId, variantId } = createWishlistDto;
      const product = await  this.productsRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const variant = await this.variantsRepository.findOne({ where: { id: variantId, product: { id: productId } } });
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }
    const existingWishlist = await this.wishlistsRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: productId }, 
        variant: { id: variantId },
      },
    });
    if (existingWishlist) {
      throw new NotFoundException('Product already in wishlist');
    }
    const wishlist = this.wishlistsRepository.create({
      user: { id: userId },
      product: { id: productId },
      variant: variantId ? { id: variantId } : undefined,
    });
    return this.wishlistsRepository.save(wishlist);
  }

  /**
   * récupérer ma liste de souhaits
   * @param userId 
   * @return ma liste de souhaits
   */
  async findMyWishlist(userId: string): Promise<Wishlist[]> {
    return await this.wishlistsRepository.find({ 
      where: { user: { id: userId } }, 
      relations: ['product.images', 'variant'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Supprimer un produit de ma liste de souhaits
   * @param userId 
   * @param whishlistId 
   * @returns 
   */
  async remove(userId: string, whishlistId: string): Promise<void> {
    const wishlist = await this.wishlistsRepository.findOne({ where: { id: whishlistId, user: { id: userId } } });
    if (!wishlist) {
      throw new NotFoundException('Wishlist item not found');
    }
    await this.wishlistsRepository.remove(wishlist);
  }

  /**
   * supprimer la liste de souhaits d'un user
   * @param userId 
   * @returns 
   */
  async clean(userId: string): Promise<void> {
    const wishlists = await this.wishlistsRepository.find({ where: { user: { id: userId } } });
    if (!wishlists) {
      throw new NotFoundException('No wishlist items found for this user');
    }
    await this.wishlistsRepository.remove(wishlists);
  }
}

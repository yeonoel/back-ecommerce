import { Injectable, NotFoundException, ForbiddenException,ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../order-items/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { ReviewResponseDto } from './dto/responses/review-response.dto';
import { ProductReviewsResponseDto } from './dto/responses/product-reviews-response.dto';
import { OrderStatus } from 'src/orders/enums/order-status.enum';
import { PurchaseVerificationResult } from './interface/purchase-verification-resultat';
import { SortOrder } from 'src/common/enums/sort-order.enum';
import { ResponseDto } from 'src/common/dto/responses/Response.dto';
import { UpdateApproveStatusDto } from './dto/update-approve-status.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponseDto } from 'src/common/dto/responses/paginated-response.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(productId: string,userId: string,createReviewDto: CreateReviewDto): Promise<Review> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product not found`);
    }
    // Vérifier que l'utilisateur a acheté ce produit
    const purchaseInfo = await this.verifyPurchase(userId, productId);
    if (!purchaseInfo.hasPurchased) {
      throw new ForbiddenException('You can only review products you have purchased');
    }
    const existingReview = await this.reviewRepository.findOne({
      where: {
        product: { id: productId },
        user: { id: userId },
        order: { id: purchaseInfo.orderId },
      },
    });
    if (existingReview) {
      throw new ConflictException('You have already reviewed this product for this order');
    }
    const review = this.reviewRepository.create({
      ...createReviewDto,
      product: { id: productId },
      user: { id: userId },
      order: { id: purchaseInfo.orderId },
      isVerifiedPurchase: true,
      isApproved: false,
    });

    return this.reviewRepository.save(review);
  }

  /**
   * Récupérer les avis d'un produit
   * @param productId 
   * @param queryDto 
   * @returns 
   */
  async findByProduct(productId: string, queryDto: QueryReviewsDto): Promise<ProductReviewsResponseDto> {
    const { page, limit, sortBy, sortOrder, filterByRating } = queryDto;
    const query = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .where('review.product_id = :productId', { productId })
      .andWhere('review.is_approved = :isApproved', { isApproved: true });
    // Filtrer par note si demandé
    if (filterByRating) {
      query.andWhere('review.rating = :rating', { rating: filterByRating });
    }
    query.orderBy(`review.${sortBy}`, sortOrder?.toUpperCase() as 'ASC' | 'DESC');
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);
    const [reviews, total] = await query.getManyAndCount();
    // Calculer les statistiques
    const stats = await this.calculateProductStats(productId);
    // Formater les avis
    const formattedReviews = reviews.map(review => this.formatReview(review));
    return {
      data: formattedReviews,
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      ratingDistribution: stats.ratingDistribution,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Récupérer un avis
   * @param id 
   * @return ResponseDto
   */
  async findOne(id: string): Promise<ResponseDto<Review>> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'product', 'order'],
    });
    if (!review) {
      throw new NotFoundException(`Review with not found`);
    }
    return {
      success: true,
      message: 'Review found successfully',
      data: review
    };
  }

  /**
   * Metttre à jour un avis
   * @param id 
   * @param userId 
   * @param updateReviewDto 
   * @return ResponseDto
   */
  async update(id: string,userId: string, updateReviewDto: UpdateReviewDto): Promise<ResponseDto<Review>> {
    const review = await this.reviewRepository.findOne({where: { id },relations: ['user'],});
    if (!review) {
      throw new NotFoundException(`Review not found`);
    }
    if (review.user.id !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }
    // Mettre à jour que les champs modifiables
    Object.assign(review, updateReviewDto);
    // Repasser en attente de modération
    review.isApproved = false;
    this.reviewRepository.save(review);

    return {
      success: true,
      message: 'Review updated successfully',
      data: review 
    }
  }

  async remove(id: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const review = await this.reviewRepository.findOne({where: { id },relations: ['user'],});
    if (!review) {
      throw new NotFoundException(`Review not found`);
    }
    if (!isAdmin && review.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }
    await this.reviewRepository.remove(review);
  }

  /**
   * Approuver un avis
   * @param id id de l'avis
   * @param updateReviewDto dto
   * @return ResponseDto
   */
 async updateApprovalStatus(updateReviewDto: UpdateApproveStatusDto): Promise<ResponseDto<Review>> {
  const review = await this.reviewRepository.findOne({ where: { id: updateReviewDto.reviewId } });
  if (!review) {
    throw new NotFoundException('Review not found');
  }
  review.isApproved = updateReviewDto.isApproved;
  await this.reviewRepository.save(review);
  return {
    success: true,
    message: updateReviewDto.isApproved ? 'Review approved successfully' : 'Review rejected successfully',
    data: review,
  };
}

/**
 * Récupérer les avis en attente de modération
 * @param page 
 * @param limit 
 * @return PaginatedResponseDto
 */
  async findPendingReviews(pagination: PaginationDto): Promise<PaginatedResponseDto<Review>> {
    const { page, limit } = pagination;
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { isApproved: false },
      relations: ['user', 'product'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  /**
   * Vérifier si l'utilisateur peut laisser un avis
   * @param userId id de l'utilisateur
   * @param productId id du produit
   * @returns 
   */
  async canUserReview(userId: string, productId: string): Promise<boolean> {
    const purchaseInfo = await this.verifyPurchase(userId, productId);
    if (!purchaseInfo.hasPurchased) {
      return false;
    }
    // Vérifier s'il n'a pas déjà laissé d'avis
    const existingReview = await this.reviewRepository.findOne({
      where: {
        product: { id: productId },
        user: { id: userId },
        order: { id: purchaseInfo.orderId },
      },
    });
    return !existingReview;
  }

  /**
   * Vérifier si l'utilisateur a acheté ce produit
   * @param userId id de l'utilisateur
   * @param productId id du produit
   * @returns 
   */
  private async verifyPurchase(userId: string, productId: string): Promise<PurchaseVerificationResult> {
    // Chercher une commande livrée contenant ce produit
    const orderItem = await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .innerJoin('orderItem.order', 'order')
      .where('order.user_id = :userId', { userId })
      .andWhere('orderItem.product_id = :productId', { productId })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .select(['orderItem.id', 'order.id'])
      .getOne();
    if (!orderItem) {
      return { hasPurchased: false };
    }
    return {
      hasPurchased: true,
      orderId: orderItem.order.id,
    };
  }

  /**
   * Calculer les statistiques du produit, 
   * notamment la note moyenne, nombre total d'avis et la la répartition des notes(1,2,3,4,5)
   * @param productId 
   * @returns 
   */
  private async calculateProductStats(productId: string) {
    // Calculer la moyenne et le total
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .where('review.product_id = :productId', { productId })
      .andWhere('review.is_approved = :isApproved', { isApproved: true })
      .getRawOne();

    // Calculer la distribution des notes
    const distribution = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('review.product_id = :productId', { productId })
      .andWhere('review.is_approved = :isApproved', { isApproved: true })
      .groupBy('review.rating')
      .getRawMany();

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach(item => {
      ratingDistribution[item.rating] = parseInt(item.count, 10);
    });

    return {
      averageRating: Number(parseInt(result.averageRating || 0).toFixed(1)),
      totalReviews: parseInt(result.totalReviews || 0, 10),
      ratingDistribution,
    };
  }

  /**
   * Formater un avis
   * @param review 
   * @returns 
   */
  private formatReview(review: Review): ReviewResponseDto {
    return {
      id: review.id,
      rating: review.rating,
      title: review.title || '',
      comment: review.comment || '',
      isVerifiedPurchase: review.isVerifiedPurchase,
      isApproved: review.isApproved,
      author: {
        firstName: review.user.firstName,
        lastNameInitial: review.user.lastName ? `${review.user.lastName.charAt(0)}.` : '',
      },
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}

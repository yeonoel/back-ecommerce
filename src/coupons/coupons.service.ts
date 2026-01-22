import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Coupon } from './entities/coupon.entity';
import { Repository } from 'typeorm';
import { CouponUsage } from 'src/coupon-usage/entities/coupon-usage.entity';
import { DiscountType } from './enums/discount-type.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { ValidateCouponResponseDto } from './dto/responses/validate-coupon-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/responses/paginated-response.dto';
import { CouponFilterDto } from './dto/coupon-filter.dto';
import { CalculationHelper } from 'src/common/helpers/calculation.helper';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    @InjectRepository(CouponUsage)
    private couponUsageRepository: Repository<CouponUsage>,
  ) {}

  /**
   * Créer un coupon
   * @param createCouponDto 
   * @returns Le coupon créer
   */
  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    const code = createCouponDto.code.toUpperCase();
    const existingCoupon = await this.couponRepository.findOne({ where: { code } });
    if (existingCoupon) {
      throw new ConflictException(`Coupon already exists`);
    }
    if (createCouponDto.discountType === DiscountType.PERCENTAGE && createCouponDto.discountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }
    if (createCouponDto.validFrom && createCouponDto.validUntil) {
      const from = new Date(createCouponDto.validFrom);
      const until = new Date(createCouponDto.validUntil);
      if (from >= until) {
        throw new BadRequestException('validFrom must be before validUntil');
      }
    }
    // Créer le coupon
    const coupon = this.couponRepository.create({
      ...createCouponDto,
      code,
      usageCount: 0,
    });
    return this.couponRepository.save(coupon);
  }

  /**
   * recuperer tous les coupons
   * @param page 
   * @param limit 
   * @returns La liste des coupons avec leur pagination
   */
  async findAllCoupons(filters: CouponFilterDto): Promise<PaginatedResponseDto<Coupon>> {
    const { page = 1, limit = 10, isValid, sortOrder='desc', sortBy='createdAt' } = filters;
    const query = this.couponRepository
      .createQueryBuilder('coupon')
      .leftJoinAndSelect('coupon.usages', 'usages')
      .leftJoinAndSelect('usages.user', 'user');
    // Le coupon est valide si le champs isActive est true et la date de validité est dans le futur
    const now = new Date();
    if (isValid === true) {
      query
      .andWhere('coupon.isActive = true')
      .andWhere('coupon.validFrom <= :now', { now })
      .andWhere('coupon.validUntil >= :now', { now })
      .andWhere('coupon.usageLimit > coupon.usageCount');
    }
     if (isValid === false) {
    query.andWhere(`
      coupon.isActive = false
      OR (coupon.validUntil IS NOT NULL AND coupon.validUntil < :now)
      OR (coupon.usageLimit IS NOT NULL AND coupon.usageCount >= coupon.usageLimit)
    `, { now });
  }
    query.orderBy(`coupon.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
    // Pagination
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);
    const [data, total] = await query.getManyAndCount();
    return {
      items: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  /**
   * récupérer un coupon par ID
   * @param id 
   * @return le coupon
   */
  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { id },relations: ['usages'],});
    if (!coupon) {
      throw new NotFoundException(`Coupon not found`);
    }
    return coupon;
  }

  /**
   * Mettre à jour un coupon
   * @param id : ID du coupon à mettre à jour
   * @param updateCouponDto 
   * @returns Le coupon mis à jour
   */
  async update(id: string, updateCouponDto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findOne(id);
    // Vérifier l'unicité du code si modifié
    if (updateCouponDto.code) {
      const code = updateCouponDto.code.toUpperCase();
      const existingCoupon = await this.couponRepository.findOne({ where: { code } });
      if (existingCoupon && existingCoupon.id !== id) {
        throw new ConflictException(`Coupon with code ${code} already exists`);
      }
      updateCouponDto.code = code;
    }
    // Validations métier
    const finalDiscountType = updateCouponDto.discountType ?? coupon.discountType;
    const finalDiscountValue = updateCouponDto.discountValue ?? coupon.discountValue;
    if (finalDiscountType === DiscountType.PERCENTAGE && finalDiscountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }
    if (updateCouponDto.validFrom && updateCouponDto.validUntil) {
      const from = new Date(updateCouponDto.validFrom);
      const until = new Date(updateCouponDto.validUntil);
      if (from >= until) {
        throw new BadRequestException('validFrom must be before validUntil');
      }
    }
    Object.assign(coupon, updateCouponDto);
    return this.couponRepository.save(coupon);
  }

  /**
   * Supprimer un coupon
   * @param id : ID du coupon à supprimer
   * @returns
   */
  async remove(id: string): Promise<void> {
    const coupon = await this.findOne(id);
    await this.couponRepository.remove(coupon);
  }

  /** 
   * Vérifier si un coupon est utilisable
   * @param validateCouponDto : Datas du coupon
   * @param userId : ID de l'utilisateur
   * @return 
   * */
  async validateCoupon(validateCouponDto: ValidateCouponDto, userId: string,): Promise<ValidateCouponResponseDto> {
    const { code, cartSousTotal } = validateCouponDto;
    const upperCode = code.toUpperCase();
    const coupon = await this.couponRepository.findOne({where: { code: upperCode }});
    if (!coupon) {
      return {isValid: false, message: 'Coupon not found'};
    }
    if (!coupon.isActive) {
      return {isValid: false, message: 'Coupon is inactive',};
    }
    // Vérifier les dates de validité
    const now = new Date();
    if (coupon.validFrom && now < new Date(coupon.validFrom)) {
      return {isValid: false, message: 'Coupon is not yet valid',};
    }
    if (coupon.validUntil && now > new Date(coupon.validUntil)) {
      return {isValid: false,message: 'Coupon has expired',};
    }
    // Vérifier la limite d'utilisation globale
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return {isValid: false, message: 'Coupon usage limit reached'};
    }
    // Vérifier le montant minimum d'achat
    if (coupon.minPurchaseAmount && cartSousTotal < Number(coupon.minPurchaseAmount)) {
      return {isValid: false,message: `Minimum purchase amount is ${coupon.minPurchaseAmount}`};
    }
    // Vérifier la limite d'utilisation par utilisateur
    const userUsageCount = await this.couponUsageRepository.count({
      where: {
        coupon: { id: coupon.id },
        user: { id: userId },
      },
    });
    if (coupon.usageLimitPerUser && userUsageCount >= coupon.usageLimitPerUser) {
      return {isValid: false,message: 'You have reached the usage limit for this coupon'};
    }
    // Calculer la réduction
    return {
      isValid: true,
      couponId: coupon.id,
    };
  }

  /**
   * Calculer la réduction sur le panier apprès application du coupon
   * @param coupon le coupon
   * @param cartSousTotal le sous-total du panier
   * @returns le montant de la réduction
   */
 public calculateDiscount(coupon: Coupon, cartSousTotal: number): number {
  cartSousTotal = CalculationHelper.max(0, cartSousTotal);
  let discount = 0;
  switch(coupon.discountType) {
    case DiscountType.PERCENTAGE:
      discount = CalculationHelper.applyDiscountPercentage(cartSousTotal, coupon.discountValue);
      break;
    case DiscountType.FIXED_AMOUNT:
      discount = CalculationHelper.applyDiscountFixedAmount(coupon.discountValue, cartSousTotal);
      break;
    default:
      throw new Error(`Unknown discount type: ${coupon.discountType}`);
  }
  if (coupon.maxDiscountAmount !== undefined) {
    discount = CalculationHelper.min(discount, coupon.maxDiscountAmount);
  }
  return discount;
}

  async applyCoupon(couponId: string, userId: string, orderId: string, discountAmount: number): Promise<void> {
    // Incrémenter le compteur d'utilisation
    await this.couponRepository.increment({ id: couponId }, 'usageCount', 1);
    const couponUsage = this.couponUsageRepository.create({
      coupon: { id: couponId },
      user: { id: userId },
      order: { id: orderId },
      discountAmount,
    });
    await this.couponUsageRepository.save(couponUsage);
  }
}

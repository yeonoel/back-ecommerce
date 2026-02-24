import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterDto } from './dto/Register.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../users/enum/userRole.enum';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthResponseDto } from './dto/Users-response';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CartsService } from 'src/carts/carts.service';
import { Store } from 'src/stores/entities/store.entity';
import { ShopCustomer } from 'src/shop-customer/entities/shop-customer.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(ShopCustomer)
    private readonly shopCustomerRepository: Repository<ShopCustomer>,
    private UsersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cartService: CartsService
  ) { }

  async validateUser(phone: string, password: string): Promise<User | null> {
    const user = await this.UsersService.findOneByPhone(phone);
    if (!user) return null;

    const ismatch = await bcrypt.compare(password, user.password);
    if (!ismatch) return null;

    return user
  }

  /**
   * Enregistrer un nouvel utilisateur
   * @param registerDto 
   * @param sessionId 
   * @returns 
   */
  async register(registerDto: RegisterDto, sessionId: string): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({ where: { phone: registerDto.phone } });
    if (user) {
      throw new ConflictException('phone already exists');
    }
    const store = await this.storeRepository.findOne({
      where: { slug: registerDto.storeSlug, isDeleted: false },
    });
    if (!store) {
      throw new NotFoundException(`Store  not found`);
    }
    const password = await bcrypt.hash(registerDto.password, 10);
    const newUser = this.userRepository.create({
      phone: registerDto.phone,
      password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      avatarUrl: registerDto.avatarUrl,
      role: UserRole.CUSTOMER,
      isActive: true,
      emailVerified: false,
    });

    await this.userRepository.save(newUser);

    // Lier le customer à la boutique dans shop_customers
    await this.shopCustomerRepository.save(
      this.shopCustomerRepository.create({ userId: newUser.id, storeId: store.id }),
    );

    return this.login(newUser, sessionId, store.id);
  }


  /**
   * Connecter un utilisateur
   * @param user 
   * @param sessionId 
   * @returns 
   */
  async login(user: User, sessionId: string, storeId: string): Promise<AuthResponseDto> {
    user.lastLoginAt = new Date();
    const payload = await this.buildJwtPayload(user, storeId);

    const token = this.jwtService.sign(payload);
    try {
      this.cartService.mergeGuestCartWithUserCart(user.id, sessionId, storeId);
    } catch (error) {
      console.error('failed to merge cart after login:', error);
    }

    return this.buildAuthResponse(user, token);
  }

  private async buildJwtPayload(user: User, storeId?: string): Promise<object> {
    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        // Le super admin n'est lié à aucune boutique
        return {
          sub: user.id,
          phone: user.phone,
          role: user.role,
        };
      case UserRole.SELLER: {
        // Le seller est lié à une boutique via shop_invitations
        // On récupère sa boutique depuis l'invitation acceptée
        const sellerStore = await this.storeRepository
          .createQueryBuilder('store')
          .innerJoin('store.invitations', 'inv')
          .where('inv.accepted_by = :userId', { userId: user.id })
          .getOne();
        return {
          sub: user.id,
          phone: user.phone,
          role: user.role,
          storeId: sellerStore?.id ?? null,
          storeSlug: sellerStore?.slug ?? null,
        };
      }
      case UserRole.CUSTOMER:
      default:
        // Le customer peut avoir plusieurs boutiques
        // On passe le storeId courant (celui où il vient de s'inscrire/connecter)
        return {
          sub: user.id,
          phone: user.phone,
          role: user.role,
          storeId: storeId ?? null, // boutique active au moment du login
        };
    }
  }

  private buildAuthResponse(user: User, token: string): AuthResponseDto {
    return {
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token: token
    };
  }
}
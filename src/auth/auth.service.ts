import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterDto } from './dto/Register.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../users/enum/userRole.enum';
import { JwtService } from '@nestjs/jwt';
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
    private readonly cartService: CartsService
  ) { }

  async validateUser(phone: string, password: string): Promise<User | null> {
    const user = await this.UsersService.findOneByPhone(phone);
    if (!user) return null;

    const ismatch = await bcrypt.compare(password, user.password?.toString() ?? 'password124');
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

    return this.login(newUser);
  }

  async


  /**
   * Connecter un utilisateur
   * @param user 
   * @param sessionId 
   * @returns 
   */
  async login(user: User): Promise<AuthResponseDto> {
    user.lastLoginAt = new Date();
    const store = await this.storeRepository.findOne({
      where: { owner: { id: user.id } },
    });
    if (!store) {
      throw new NotFoundException('Votre boutique n\'existe pas');
    }
    const payload = await this.buildJwtPayload(user);

    const token = this.jwtService.sign(payload);
    return this.buildAuthResponse(user, token, store?.slug, store?.logoUrl);
  }

  private async buildJwtPayload(user: User): Promise<object> {
    // On récupère sa boutique depuis l'invitation acceptée
    const sellerStore = await this.storeRepository.findOne({
      where: { owner: { id: user.id } },
    })
    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        // Le super admin n'est lié à aucune boutique
        return {
          sub: user.id,
          phone: user.phone,
          role: user.role,
        };
      case UserRole.SELLER: {
        return {
          sub: user.id,
          phone: user.phone,
          role: user.role,
          slugStore: sellerStore?.slug ?? null,
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
          slugStore: sellerStore?.slug ?? null,
        };
    }
  }

  private buildAuthResponse(user: User, token: string, storeSlug?: string, storeLogoUrl?: string): AuthResponseDto {
    return {
      success: true,
      data: {
        id: user.id,
        role: user.role,
        phone: user.phone,
        logoStore: storeLogoUrl,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        slugStore: storeSlug
      },
      token: token
    };
  }
}
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private UsersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cartService: CartsService
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.UsersService.findOneByEmail(email);
    if(!user) return null;

    const ismatch = await bcrypt.compare(password, user.password);
    if(!ismatch) return null;

    return user
  }

  /**
   * Enregistrer un nouvel utilisateur
   * @param registerDto 
   * @param sessionId 
   * @returns 
   */
  async register(registerDto: RegisterDto, sessionId: string): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({where: {email: registerDto.email}});
    if (user) {
      throw new ConflictException('email already exists');
    }
    if(registerDto.phone) {
      const existingPhone = await this.userRepository.findOne({where: {phone: registerDto.phone}});
      if (existingPhone) {
        throw new ConflictException('phone already exists');
      }
    }
    const password = await bcrypt.hash(registerDto.password, 10);
    const newUser =  this.userRepository.create({
      email: registerDto.email,
      password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      avatarUrl: registerDto.avatarUrl,
      role: UserRole.CUSTOMER,
      isActive: true,
      emailVerified: false,
    });
    return this.login(newUser, sessionId);
  }


  /**
   * Connecter un utilisateur
   * @param user 
   * @param sessionId 
   * @returns 
   */
  async login(user: User, sessionId: string): Promise<AuthResponseDto> {
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);
    const payload = {
    sub: user.id,
    email: user.email,
    role: user.role
   }
   const token = this.jwtService.sign(payload);
   try {
    this.cartService.mergeGuestCartWithUserCart(user.id, sessionId);
   } catch (error) {
    console.error('failed to merge cart after login:', error);
   }

   return this.buildAuthResponse(user, token);
  }  

  private buildAuthResponse(user: User, token: string): AuthResponseDto {
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone
      },
      token: token
    };
  }
}
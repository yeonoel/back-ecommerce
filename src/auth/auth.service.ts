import { ConflictException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterDto } from './dto/Register.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../users/enum/userRole.enum';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersResponseDto } from './dto/Users-response';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}
  async register(registerDto: RegisterDto): Promise<UsersResponseDto> {

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
    
   console.log('JWT_SECRET:', this.configService.get<string>('security.jwtSecret'));
    await this.userRepository.save(newUser);
    
    const payload = {
    sub: newUser.id,
    email: newUser.email,
   }

   const token = this.jwtService.sign(payload);

   return this.buildAuthResponse(newUser, token);
  }




  private buildAuthResponse(user: User, token: string): UsersResponseDto {
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    };
  }
}
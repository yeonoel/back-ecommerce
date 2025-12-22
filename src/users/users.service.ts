import { ConflictException, Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/Create-user.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from './enum/userRole.enum';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersResponseDto } from './dto/Users-response';
import { AUTH_CONSTANTS } from '../common/constants/auth.constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}
  async register(createUserDto: CreateUserDto): Promise<UsersResponseDto> {

    const user = await this.userRepository.findOne({where: {email: createUserDto.email}});

    if (user) {
      throw new ConflictException('email already exists');
    }

    const existingPhone = await this.userRepository.findOne({where: {phone: createUserDto.phone}});

    if (existingPhone) {
      throw new ConflictException('phone already exists');
    }

    const password = await bcrypt.hash(createUserDto.password, 10);

    const newUser =  this.userRepository.create({
      email: createUserDto.email,
      password,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      phone: createUserDto.phone,
      avatarUrl: createUserDto.avatarUrl,
      role: UserRole.CUSTOMER,
      isActive: true,
      emailVerified: false,
   });
    
   console.log('JWT_SECRET:', this.configService.get('JWT_SECRET'));
    await this.userRepository.save(newUser);
    
    const payload = {
    sub: newUser.id,
    email: newUser.email,
   }

   const token = this.jwtService.sign(payload);

   console.log('JWT_SECRET from ConfigService:', this.configService.get('JWT_SECRET'));
   console.log('JWT_SECRET at startup:', process.env.JWT_SECRET);

   return this.buildAuthResponse(newUser, token);
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
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
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseDto } from 'src/common/dto/ResponseDto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User> 
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({where: {email: email}});
    return user
  }


  async findById(id: string): Promise<ResponseDto> {
    const user = await this.userRepository.findOne({where: {id: id}});
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      success: true,
      message: 'User updated successfully',
      data: user
    }
  }

  async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<ResponseDto> {
    const user = await this.userRepository.findOne({where: {id: id}});
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateUserDto);
    await  this.userRepository.save(user);
    return {
      success: true,
      message: 'User updated successfully',
      data: user
    }
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}

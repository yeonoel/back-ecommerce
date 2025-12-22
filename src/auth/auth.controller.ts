import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './auth.service';
import { RegisterDto } from './dto/Register.dto';
import { UsersResponseDto } from './dto/Users-response';

@Controller('auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  register(@Body() createUserDto: RegisterDto): Promise<UsersResponseDto> {
    return this.usersService.register(createUserDto);
  }

  
}

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/Register.dto';
import { UsersResponseDto } from './dto/Users-response';

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  register(@Body() createUserDto: RegisterDto): Promise<UsersResponseDto> {
    return this.usersService.register(createUserDto);
  }

  
}

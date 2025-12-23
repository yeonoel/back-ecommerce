import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/Register.dto';
import { AuthLoginResponseDto, UsersResponseDto } from './dto/Users-response';
import { ApiTags } from '@nestjs/swagger';
import { LocalStrategy } from './strategies/local.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  register(@Body() createUserDto: RegisterDto): Promise<UsersResponseDto> {
    return this.authService.register(createUserDto);
  }

  @UseGuards(LocalStrategy)
  @Post("login")
  login(@Req() req): Promise<AuthLoginResponseDto> {
    return this.authService.login(req);
  }  
}

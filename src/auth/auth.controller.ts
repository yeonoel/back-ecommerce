import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/Register.dto';
import { AuthResponseDto } from './dto/Users-response';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  register(@Body() createUserDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(createUserDto);
  }

  @UseGuards(AuthGuard('local'))
  @Post("login")
  @HttpCode(HttpStatus.OK)  
  login(@Req() req): Promise<AuthResponseDto> {
    return this.authService.login(req.user);
  }  
}

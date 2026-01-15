import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req, Session } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/Register.dto';
import { AuthResponseDto } from './dto/Users-response';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../common/decorators/public.decorator';
import { SessionId } from '../common/decorators/session.decorator';

@ApiTags('auth')
@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  register(@Body() createUserDto: RegisterDto, @SessionId() sessionId): Promise<AuthResponseDto> {
    return this.authService.register(createUserDto, sessionId);
  }

  @UseGuards(AuthGuard('local'))
  @Post("login")
  @HttpCode(HttpStatus.OK)  
  login(@Req() req, @SessionId() sessionId): Promise<AuthResponseDto> {
    return this.authService.login(req.user, sessionId);
  }  
}

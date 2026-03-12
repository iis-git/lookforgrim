import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import type { JwtPayload } from '../../shared/auth/jwt-payload.type';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SetupAdminDto } from './dto/setup-admin.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('setup-admin')
  setupAdmin(@Body() dto: SetupAdminDto) {
    return this.authService.setupAdmin(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout() {
    return this.authService.logout();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getCurrentUser(user);
  }
}

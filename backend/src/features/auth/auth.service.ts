import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../entities/user.entity';
import { JwtPayload } from '../../shared/auth/jwt-payload.type';
import { UserRole } from '../../shared/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SetupAdminDto } from './dto/setup-admin.dto';
import { LoginResponse, TokenPair } from './auth.types';

const DEFAULT_SALT_ROUNDS = 12;
const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async setupAdmin(dto: SetupAdminDto) {
    const expectedSetupToken = this.configService.get<string>(
      'INIT_ADMIN_SETUP_TOKEN',
    );

    if (!expectedSetupToken || dto.setupToken !== expectedSetupToken) {
      throw new UnauthorizedException('Invalid setup token');
    }

    const privilegedUsersCount = await this.usersService.countPrivilegedUsers();
    if (privilegedUsersCount > 0) {
      throw new ConflictException('Admin setup already completed');
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      this.getSaltRoundsOrDefault(),
    );

    const user = await this.usersService.createUser({
      email: dto.email,
      passwordHash,
      role: UserRole.ADMIN,
    });

    return this.usersService.toPublicUser(user);
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersService.getByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokenPair(user);

    return {
      user: this.usersService.toPublicUser(user),
      ...tokens,
    };
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const user = await this.usersService.getByIdOrThrow(payload.sub);

    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    return this.issueTokenPair(user);
  }

  async getCurrentUser(payload: JwtPayload) {
    const user = await this.usersService.getByIdOrThrow(payload.sub);
    return this.usersService.toPublicUser(user);
  }

  logout(): { success: true } {
    return { success: true };
  }

  private async issueTokenPair(user: UserEntity): Promise<TokenPair> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenType: 'access',
    };

    const refreshPayload: JwtPayload = {
      ...accessPayload,
      tokenType: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.getAccessSecret(),
        expiresIn: this.getTokenTtlSeconds(
          'JWT_ACCESS_EXPIRES_IN_SECONDS',
          DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
        ),
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.getRefreshSecret(),
        expiresIn: this.getTokenTtlSeconds(
          'JWT_REFRESH_EXPIRES_IN_SECONDS',
          DEFAULT_REFRESH_TOKEN_TTL_SECONDS,
        ),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.getRefreshSecret(),
      });

      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token type');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private getAccessSecret(): string {
    return (
      this.configService.get<string>('JWT_ACCESS_SECRET') ??
      'dev-access-secret-change-me'
    );
  }

  private getRefreshSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      'dev-refresh-secret-change-me'
    );
  }

  private getSaltRoundsOrDefault(): number {
    const configured = Number(
      this.configService.get<string>('PASSWORD_SALT_ROUNDS'),
    );
    if (Number.isNaN(configured) || configured < 8) {
      return DEFAULT_SALT_ROUNDS;
    }

    return configured;
  }

  private getTokenTtlSeconds(
    configKey: string,
    fallbackSeconds: number,
  ): number {
    const configured = Number(this.configService.get<string>(configKey));

    if (Number.isNaN(configured) || configured < 1) {
      return fallbackSeconds;
    }

    return configured;
  }
}

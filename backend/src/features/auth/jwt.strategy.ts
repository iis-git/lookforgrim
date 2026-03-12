import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../shared/auth/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_ACCESS_SECRET') ??
        'dev-access-secret-change-me',
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    if (payload.tokenType !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    return payload;
  }
}

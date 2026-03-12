import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ArtistAvailabilityEntity } from './entities/artist-availability.entity';
import { ArtistEntity } from './entities/artist.entity';
import { MediaFileEntity } from './entities/media-file.entity';
import { StationaryPointEntity } from './entities/stationary-point.entity';
import { UserEntity } from './entities/user.entity';
import { ArtistsModule } from './features/artists/artists.module';
import { AuthModule } from './features/auth/auth.module';
import { HealthModule } from './features/health/health.module';
import { MapSearchModule } from './features/map-search/map-search.module';
import { PointsModule } from './features/points/points.module';
import { UsersModule } from './features/users/users.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { JwtAuthGuard } from './shared/auth/jwt-auth.guard';
import { RolesGuard } from './shared/auth/roles.guard';

const DEFAULT_PORT = 5432;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const dbPort =
          Number(configService.get<string>('DB_PORT')) || DEFAULT_PORT;

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST') ?? 'localhost',
          port: dbPort,
          username: configService.get<string>('DB_USER') ?? 'postgres',
          password: configService.get<string>('DB_PASSWORD') ?? 'postgres',
          database: configService.get<string>('DB_NAME') ?? 'lookforgrim',
          entities: [
            UserEntity,
            ArtistEntity,
            ArtistAvailabilityEntity,
            StationaryPointEntity,
            MediaFileEntity,
          ],
          synchronize: false,
          logging: toBoolean(configService.get<string>('DB_LOGGING')),
          ssl: toBoolean(configService.get<string>('DB_SSL'))
            ? { rejectUnauthorized: false }
            : false,
        };
      },
    }),
    StorageModule,
    UsersModule,
    AuthModule,
    ArtistsModule,
    PointsModule,
    MapSearchModule,
    HealthModule,
  ],
  providers: [JwtAuthGuard, RolesGuard],
})
export class AppModule {}

function toBoolean(value: string | undefined): boolean {
  if (value === undefined) {
    return false;
  }

  return ['true', '1', 'yes', 'y', 'on'].includes(value.toLowerCase());
}

import 'reflect-metadata';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { ArtistAvailabilityEntity } from '../entities/artist-availability.entity';
import { ArtistEntity } from '../entities/artist.entity';
import { MediaFileEntity } from '../entities/media-file.entity';
import { StationaryPointEntity } from '../entities/stationary-point.entity';
import { UserEntity } from '../entities/user.entity';
import { InitSchema1741813200000 } from './migrations/1741813200000-init-schema';

const DEFAULT_DB_PORT = 5432;

export function toBoolean(value: string | undefined): boolean {
  if (value === undefined) {
    return false;
  }

  return ['true', '1', 'yes', 'y', 'on'].includes(value.toLowerCase());
}

export function createDataSourceOptions(
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions {
  const dbPort = Number(env.DB_PORT) || DEFAULT_DB_PORT;

  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: dbPort,
    username: env.DB_USER ?? 'postgres',
    password: env.DB_PASSWORD ?? 'postgres',
    database: env.DB_NAME ?? 'lookforgrim',
    ssl: toBoolean(env.DB_SSL) ? { rejectUnauthorized: false } : false,
    logging: toBoolean(env.DB_LOGGING),
    synchronize: false,
    entities: [
      UserEntity,
      ArtistEntity,
      ArtistAvailabilityEntity,
      StationaryPointEntity,
      MediaFileEntity,
    ],
    migrations: [InitSchema1741813200000],
    migrationsTableName: 'typeorm_migrations',
  };
}

export const AppDataSource = new DataSource(createDataSourceOptions());

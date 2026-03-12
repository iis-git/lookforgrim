import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ArtistCategory } from '../../../shared/enums/artist-category.enum';
import { ArtistServiceKind } from '../../../shared/enums/artist-service-kind.enum';

function toArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => toPrimitiveString(item))
      .filter((item): item is string => item !== undefined);
  }

  const normalized = toPrimitiveString(value);
  if (!normalized) {
    return undefined;
  }

  return normalized
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = toPrimitiveString(value)?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }

  return undefined;
}

function toPrimitiveString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return `${value}`;
  }

  return undefined;
}

export class NearestArtistsDto {
  @IsOptional()
  @IsUUID()
  pointId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  metroStation?: string;

  @IsOptional()
  @Transform(({ value }) => toArray(value))
  @IsArray()
  @IsEnum(ArtistCategory, { each: true })
  category?: ArtistCategory[];

  @IsOptional()
  @Transform(({ value }) => toArray(value))
  @IsArray()
  @IsEnum(ArtistServiceKind, { each: true })
  services?: ArtistServiceKind[];

  @IsOptional()
  @Transform(({ value }) => toArray(value))
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @Type(() => Boolean)
  @IsBoolean()
  hasCar?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsDateString()
  orderDateTime?: string;
}

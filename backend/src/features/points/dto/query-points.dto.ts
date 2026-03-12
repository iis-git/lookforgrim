import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PointType } from '../../../shared/enums/point-type.enum';

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

function toPrimitiveString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return `${value}`;
  }

  return undefined;
}

export class QueryPointsDto {
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
  @IsEnum(PointType, { each: true })
  types?: PointType[];
}

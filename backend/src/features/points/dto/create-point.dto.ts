import { Type } from 'class-transformer';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PointType } from '../../../shared/enums/point-type.enum';
import { VisibilityScope } from '../../../shared/enums/visibility-scope.enum';

export class CreatePointDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsEnum(PointType)
  type!: PointType;

  @IsString()
  @MaxLength(500)
  address!: string;

  @IsString()
  @MaxLength(120)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  metroStation?: string;

  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  workingHours?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(VisibilityScope)
  visibility?: VisibilityScope;
}

import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PointType } from '../../../shared/enums/point-type.enum';
import { VisibilityScope } from '../../../shared/enums/visibility-scope.enum';

export class UpdatePointDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEnum(PointType)
  type?: PointType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

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

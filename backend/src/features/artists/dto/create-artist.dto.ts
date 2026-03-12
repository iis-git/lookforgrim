import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ArtistCategory } from '../../../shared/enums/artist-category.enum';
import { ArtistServiceKind } from '../../../shared/enums/artist-service-kind.enum';
import { VisibilityScope } from '../../../shared/enums/visibility-scope.enum';
import { ArtistAvailabilitySlotDto } from './artist-availability-slot.dto';

export class CreateArtistDto {
  @IsString()
  @MaxLength(255)
  fullName!: string;

  @IsString()
  @MaxLength(32)
  phonePersonal!: string;

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

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(300)
  workRadiusKm?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasCar?: boolean;

  @IsOptional()
  @IsEnum(ArtistCategory)
  category?: ArtistCategory;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(ArtistServiceKind, { each: true })
  services?: ArtistServiceKind[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsEnum(VisibilityScope)
  visibility?: VisibilityScope;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArtistAvailabilitySlotDto)
  availabilitySlots?: ArtistAvailabilitySlotDto[];
}

import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ArtistAvailabilitySlotDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

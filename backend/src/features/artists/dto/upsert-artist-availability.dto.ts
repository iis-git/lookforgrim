import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { ArtistAvailabilitySlotDto } from './artist-availability-slot.dto';

export class UpsertArtistAvailabilityDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ArtistAvailabilitySlotDto)
  slots!: ArtistAvailabilitySlotDto[];
}

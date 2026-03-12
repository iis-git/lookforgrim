import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtistAvailabilityEntity } from '../../entities/artist-availability.entity';
import { ArtistEntity } from '../../entities/artist.entity';
import { MediaModule } from '../media/media.module';
import { ArtistsController } from './artists.controller';
import { ArtistsService } from './artists.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArtistEntity, ArtistAvailabilityEntity]),
    MediaModule,
  ],
  controllers: [ArtistsController],
  providers: [ArtistsService],
  exports: [ArtistsService],
})
export class ArtistsModule {}

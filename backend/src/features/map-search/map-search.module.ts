import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtistEntity } from '../../entities/artist.entity';
import { StationaryPointEntity } from '../../entities/stationary-point.entity';
import { MapSearchController } from './map-search.controller';
import { MapSearchService } from './map-search.service';

@Module({
  imports: [TypeOrmModule.forFeature([ArtistEntity, StationaryPointEntity])],
  controllers: [MapSearchController],
  providers: [MapSearchService],
})
export class MapSearchModule {}

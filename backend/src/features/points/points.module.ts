import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StationaryPointEntity } from '../../entities/stationary-point.entity';
import { MediaModule } from '../media/media.module';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';

@Module({
  imports: [TypeOrmModule.forFeature([StationaryPointEntity]), MediaModule],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}

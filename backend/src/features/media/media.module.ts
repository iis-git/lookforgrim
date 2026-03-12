import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaFileEntity } from '../../entities/media-file.entity';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { MediaService } from './media.service';

@Module({
  imports: [TypeOrmModule.forFeature([MediaFileEntity]), StorageModule],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}

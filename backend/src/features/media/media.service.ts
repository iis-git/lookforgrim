import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaFileEntity } from '../../entities/media-file.entity';
import { STORAGE_SERVICE } from '../../infrastructure/storage/storage.contract';
import { MediaOwnerType } from '../../shared/enums/media-owner-type.enum';
import { UploadedImageInput } from '../../shared/http/uploaded-image.util';
import type { StorageService } from '../../infrastructure/storage/storage.contract';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(MediaFileEntity)
    private readonly mediaFilesRepository: Repository<MediaFileEntity>,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: StorageService,
  ) {}

  async uploadForArtist(
    artistId: string,
    image: UploadedImageInput,
  ): Promise<MediaFileEntity> {
    return this.uploadAndPersist({
      ownerType: MediaOwnerType.ARTIST,
      ownerId: artistId,
      folder: `artists/${artistId}`,
      image,
    });
  }

  async listForArtist(artistId: string): Promise<MediaFileEntity[]> {
    return this.mediaFilesRepository.find({
      where: {
        ownerType: MediaOwnerType.ARTIST,
        ownerId: artistId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async listForPoint(pointId: string): Promise<MediaFileEntity[]> {
    return this.mediaFilesRepository.find({
      where: {
        ownerType: MediaOwnerType.POINT,
        ownerId: pointId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async removeForArtist(
    artistId: string,
    mediaId: string,
  ): Promise<{ success: true }> {
    return this.removeForOwner(MediaOwnerType.ARTIST, artistId, mediaId);
  }

  async removeForPoint(
    pointId: string,
    mediaId: string,
  ): Promise<{ success: true }> {
    return this.removeForOwner(MediaOwnerType.POINT, pointId, mediaId);
  }

  async uploadForPoint(
    pointId: string,
    image: UploadedImageInput,
  ): Promise<MediaFileEntity> {
    return this.uploadAndPersist({
      ownerType: MediaOwnerType.POINT,
      ownerId: pointId,
      folder: `points/${pointId}`,
      image,
    });
  }

  private async uploadAndPersist(params: {
    ownerType: MediaOwnerType;
    ownerId: string;
    folder: string;
    image: UploadedImageInput;
  }): Promise<MediaFileEntity> {
    const uploaded = await this.storageService.upload({
      buffer: params.image.buffer,
      mimeType: params.image.mimeType,
      originalName: params.image.originalName,
      folder: params.folder,
    });

    const entity = this.mediaFilesRepository.create({
      ownerType: params.ownerType,
      ownerId: params.ownerId,
      storageProvider: 'local',
      fileKey: uploaded.fileKey,
      publicUrl: uploaded.publicUrl,
      mimeType: params.image.mimeType,
      sizeBytes: uploaded.sizeBytes,
    });

    return this.mediaFilesRepository.save(entity);
  }

  private async removeForOwner(
    ownerType: MediaOwnerType,
    ownerId: string,
    mediaId: string,
  ): Promise<{ success: true }> {
    const media = await this.mediaFilesRepository.findOne({
      where: {
        id: mediaId,
        ownerType,
        ownerId,
      },
    });

    if (!media) {
      throw new NotFoundException('Media file not found');
    }

    await this.storageService.delete(media.fileKey);
    await this.mediaFilesRepository.softDelete(media.id);

    return { success: true };
  }
}

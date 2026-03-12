import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MediaOwnerType } from '../shared/enums/media-owner-type.enum';

@Entity({ name: 'media_files' })
export class MediaFileEntity extends BaseEntity {
  @Column({ name: 'owner_type', type: 'enum', enum: MediaOwnerType })
  ownerType!: MediaOwnerType;

  @Index()
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @Column({ name: 'storage_provider', type: 'varchar', length: 50 })
  storageProvider!: string;

  @Index({ unique: true })
  @Column({ name: 'file_key', type: 'varchar', length: 500 })
  fileKey!: string;

  @Column({ name: 'public_url', type: 'varchar', length: 500 })
  publicUrl!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 120 })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'integer' })
  sizeBytes!: number;
}

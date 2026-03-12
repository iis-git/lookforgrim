import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { extname, isAbsolute, join } from 'node:path';
import {
  StorageService,
  StorageUploadInput,
  StorageUploadResult,
} from './storage.contract';

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly logger = new Logger(LocalStorageService.name);

  constructor(private readonly configService: ConfigService) {}

  async upload(params: StorageUploadInput): Promise<StorageUploadResult> {
    const uploadsRoot = this.resolveUploadsRoot();
    const folderPath = join(uploadsRoot, params.folder);

    await mkdir(folderPath, { recursive: true });

    const extension = extname(params.originalName).toLowerCase();
    const fileName = `${randomUUID()}${extension}`;
    const absoluteFilePath = join(folderPath, fileName);

    await writeFile(absoluteFilePath, params.buffer);

    const fileKey = join(params.folder, fileName).replaceAll('\\', '/');
    const mediaBaseUrl =
      this.configService.get<string>('MEDIA_BASE_URL')?.replace(/\/$/, '') ??
      '/media';

    return {
      fileKey,
      publicUrl: `${mediaBaseUrl}/${fileKey}`,
      sizeBytes: params.buffer.byteLength,
    };
  }

  async delete(fileKey: string): Promise<void> {
    const absoluteFilePath = join(this.resolveUploadsRoot(), fileKey);

    try {
      await rm(absoluteFilePath);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        this.logger.warn(`File not found for deletion: ${fileKey}`);
        return;
      }

      throw error;
    }
  }

  resolveUploadsRoot(): string {
    const configuredPath =
      this.configService.get<string>('UPLOADS_DIR') ?? 'uploads';

    if (isAbsolute(configuredPath)) {
      return configuredPath;
    }

    return join(process.cwd(), configuredPath);
  }
}

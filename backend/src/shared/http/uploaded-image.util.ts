import { BadRequestException } from '@nestjs/common';
import type { MultipartFile } from '@fastify/multipart';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export type UploadedImageInput = {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
};

export async function parseUploadedImage(
  file: MultipartFile | undefined,
): Promise<UploadedImageInput> {
  if (!file) {
    throw new BadRequestException('Image file is required');
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    throw new BadRequestException('Only image files are supported');
  }

  const buffer = await file.toBuffer();

  if (buffer.byteLength === 0) {
    throw new BadRequestException('Uploaded image is empty');
  }

  return {
    buffer,
    mimeType: file.mimetype,
    originalName: sanitizeFileName(file.filename),
  };
}

function sanitizeFileName(fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

  if (!safeName) {
    return 'image.jpg';
  }

  return safeName;
}

export const STORAGE_SERVICE = 'STORAGE_SERVICE';

export type StorageUploadInput = {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  folder: string;
};

export type StorageUploadResult = {
  fileKey: string;
  publicUrl: string;
  sizeBytes: number;
};

export interface StorageService {
  upload(params: StorageUploadInput): Promise<StorageUploadResult>;
  delete(fileKey: string): Promise<void>;
}

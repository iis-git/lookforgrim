import type { MultipartFile } from '@fastify/multipart';
import type { FastifyRequest } from 'fastify';

export type MultipartRequest = FastifyRequest & {
  file: () => Promise<MultipartFile | undefined>;
};

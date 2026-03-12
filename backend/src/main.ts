import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { mkdir } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const corsOrigins = parseCorsOrigins(
    configService.get<string>('CORS_ORIGIN'),
  );
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 8 * 1024 * 1024,
      files: 1,
    },
  });

  const uploadsRoot = resolveUploadsRoot(
    configService.get<string>('UPLOADS_DIR') ?? 'uploads',
  );

  await mkdir(uploadsRoot, { recursive: true });
  await app.register(fastifyStatic, {
    root: uploadsRoot,
    prefix: '/media/',
    decorateReply: false,
  });

  const port = Number(configService.get<string>('PORT')) || 3000;
  await app.listen(port, '0.0.0.0');
}

function parseCorsOrigins(value: string | undefined): true | string[] {
  if (!value) {
    return true;
  }

  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : true;
}

function resolveUploadsRoot(configuredPath: string): string {
  if (isAbsolute(configuredPath)) {
    return configuredPath;
  }

  return join(process.cwd(), configuredPath);
}

void bootstrap();

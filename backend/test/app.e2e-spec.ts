import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import { HealthModule } from '../src/features/health/health.module';

describe('AppController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HealthModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/v1/health')
      .expect(200)
      .expect((response) => {
        const body = response.body as { status?: string };
        expect(body.status).toBe('ok');
      });
  });
});

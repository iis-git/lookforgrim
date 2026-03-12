import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './features/health/health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = moduleRef.get<HealthController>(HealthController);
  });

  it('returns service health payload', () => {
    const payload = controller.getHealth();

    expect(payload.status).toBe('ok');
    expect(typeof payload.timestamp).toBe('string');
  });
});

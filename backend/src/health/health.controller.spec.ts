import { HealthController } from './health.controller';
import { EmailQueueService } from '../email-queue/email-queue.service';
import { ServiceUnavailableException } from '@nestjs/common';
import { mockDeep } from 'jest-mock-extended';

describe('HealthController', () => {
  let controller: HealthController;
  let emailQueueService: EmailQueueService;

  beforeEach(() => {
    emailQueueService = mockDeep<EmailQueueService>();
    controller = new HealthController(emailQueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('health', () => {
    it('should return healthy status when queue is healthy', async () => {
      (emailQueueService.isHealthy as any).mockResolvedValue(true);

      const result = await controller.health();

      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        services: {
          email: 'ok',
        },
      });
    });

    it('should return degraded status when queue is unhealthy', async () => {
      (emailQueueService.isHealthy as any).mockResolvedValue(false);

      const result = await controller.health();

      expect(result).toEqual({
        status: 'degraded',
        timestamp: expect.any(String),
        services: {
          email: 'unhealthy',
        },
      });
    });
  });

  describe('ready', () => {
    it('should return ready status when queue is healthy', async () => {
      (emailQueueService.isHealthy as any).mockResolvedValue(true);

      const result = await controller.ready();

      expect(result).toEqual({
        status: 'ready',
        service: 'auth-backend',
        email: 'ready',
      });
    });

    it('should return not-ready status when queue is unhealthy', async () => {
      (emailQueueService.isHealthy as any).mockResolvedValue(false);

      const result = await controller.ready();

      expect(result).toEqual({
        status: 'not-ready',
        service: 'auth-backend',
        email: 'unhealthy',
      });
    });
  });

  describe('queueStats', () => {
    it('should return queue stats', async () => {
      const mockStats = {
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 1,
      };

      (emailQueueService.getStats as any).mockResolvedValue(mockStats);

      const result = await controller.queueStats();

      expect(result).toEqual(mockStats);
    });

    it('should throw ServiceUnavailableException when getStats fails', async () => {
      (emailQueueService.getStats as any).mockRejectedValue(new Error('Redis not connected'));

      await expect(controller.queueStats()).rejects.toThrow(ServiceUnavailableException);
    });

    it('should throw ServiceUnavailableException with correct error details', async () => {
      (emailQueueService.getStats as any).mockRejectedValue(new Error('Redis not connected'));

      try {
        await controller.queueStats();
        fail('Should have thrown ServiceUnavailableException');
      } catch (error: any) {
        expect(error.response).toEqual({
          error: 'Email worker not ready',
          message: 'Redis connection not established',
        });
      }
    });
  });
});

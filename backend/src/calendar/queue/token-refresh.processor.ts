import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CALENDAR_QUEUES } from './calendar-queue.constants';
import { TokenRefreshJobData } from '../types/calendar.types';
import { CalendarTokenService } from '../services/calendar-token.service';

@Processor(CALENDAR_QUEUES.TOKEN_REFRESH)
export class TokenRefreshProcessor extends WorkerHost {
  private readonly logger = new Logger(TokenRefreshProcessor.name);

  constructor(private readonly tokenService: CalendarTokenService) {
    super();
  }

  async process(job: Job<TokenRefreshJobData>): Promise<void> {
    const { connectionId, provider, isProactive } = job.data;
    this.logger.log(
      `Refreshing token for connection ${connectionId} (${provider}, proactive: ${isProactive})`,
    );

    try {
      await this.tokenService.getValidToken(connectionId);
      this.logger.log(`Token refreshed successfully for ${connectionId}`);
    } catch (error) {
      this.logger.error(`Failed to refresh token for ${connectionId}:`, error);
      throw error;
    }
  }
}

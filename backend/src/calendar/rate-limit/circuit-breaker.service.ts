import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { CalendarProvider } from '@prisma/client';
import { CircuitState } from '../types/calendar.types';

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly redis: Redis;
  private readonly FAILURE_THRESHOLD = 5;
  private readonly RECOVERY_TIMEOUT = 30000;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async isOpen(provider: CalendarProvider): Promise<boolean> {
    const state = await this.getState(provider);

    if (state.status === 'open') {
      if (Date.now() > state.nextAttemptAt) {
        await this.setState(provider, { ...state, status: 'half-open' });
        this.logger.log(`Circuit breaker for ${provider} entering half-open state`);
        return false;
      }
      return true;
    }

    return false;
  }

  async recordSuccess(provider: CalendarProvider): Promise<void> {
    const state = await this.getState(provider);

    if (state.status === 'half-open' || state.failures > 0) {
      await this.setState(provider, {
        status: 'closed',
        failures: 0,
        nextAttemptAt: 0,
      });
      this.logger.log(`Circuit breaker for ${provider} closed after success`);
    }
  }

  async recordFailure(provider: CalendarProvider, error?: string): Promise<void> {
    const state = await this.getState(provider);
    const newFailures = state.failures + 1;

    if (newFailures >= this.FAILURE_THRESHOLD) {
      await this.setState(provider, {
        status: 'open',
        failures: newFailures,
        nextAttemptAt: Date.now() + this.RECOVERY_TIMEOUT,
        lastError: error,
      });
      this.logger.warn(`Circuit breaker for ${provider} opened after ${newFailures} failures`);
    } else {
      await this.setState(provider, {
        ...state,
        failures: newFailures,
        lastError: error,
      });
    }
  }

  async getStatus(provider: CalendarProvider): Promise<CircuitState> {
    return this.getState(provider);
  }

  async getAllStatus(): Promise<Record<CalendarProvider, CircuitState>> {
    const providers: CalendarProvider[] = ['GOOGLE', 'MICROSOFT', 'APPLE'];
    const states: Record<string, CircuitState> = {};

    for (const provider of providers) {
      states[provider] = await this.getState(provider);
    }

    return states as Record<CalendarProvider, CircuitState>;
  }

  async reset(provider: CalendarProvider): Promise<void> {
    await this.setState(provider, {
      status: 'closed',
      failures: 0,
      nextAttemptAt: 0,
    });
    this.logger.log(`Circuit breaker for ${provider} manually reset`);
  }

  private async getState(provider: CalendarProvider): Promise<CircuitState> {
    const key = `circuit:${provider}`;
    const data = await this.redis.get(key);

    if (data) {
      return JSON.parse(data);
    }

    return { status: 'closed', failures: 0, nextAttemptAt: 0 };
  }

  private async setState(provider: CalendarProvider, state: CircuitState): Promise<void> {
    const key = `circuit:${provider}`;
    await this.redis.set(key, JSON.stringify(state), 'EX', 3600);
  }
}

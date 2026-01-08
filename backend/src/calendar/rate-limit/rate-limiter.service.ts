import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { CalendarProvider } from '@prisma/client';
import { RateLimitConfig } from '../types/calendar.types';

const RATE_CONFIGS: Record<CalendarProvider, RateLimitConfig> = {
  GOOGLE: {
    provider: 'GOOGLE',
    limits: { perSecond: 10, perMinute: 500 },
    userLimits: { perSecond: 5, perMinute: 250 },
  },
  MICROSOFT: {
    provider: 'MICROSOFT',
    limits: { perSecond: 15, perMinute: 800 },
    userLimits: { perSecond: 10, perMinute: 500 },
  },
  APPLE: {
    provider: 'APPLE',
    limits: { perSecond: 2, perMinute: 60 },
    userLimits: { perSecond: 1, perMinute: 30 },
  },
};

@Injectable()
export class CalendarRateLimiterService {
  private readonly logger = new Logger(CalendarRateLimiterService.name);
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async checkLimit(
    provider: CalendarProvider,
    userId: string,
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    const config = RATE_CONFIGS[provider];
    const now = Date.now();

    const userKey = `ratelimit:${provider}:user:${userId}`;
    const userCount = await this.redis.zcount(userKey, now - 1000, now);

    if (userCount >= config.userLimits.perSecond) {
      this.logger.debug(`User rate limit hit for ${userId} on ${provider}`);
      return { allowed: false, retryAfter: 1000 };
    }

    const appKey = `ratelimit:${provider}:app`;
    const appCount = await this.redis.zcount(appKey, now - 1000, now);

    if (appCount >= config.limits.perSecond) {
      this.logger.debug(`App rate limit hit for ${provider}`);
      return { allowed: false, retryAfter: 1000 };
    }

    return { allowed: true };
  }

  async recordRequest(provider: CalendarProvider, userId: string): Promise<void> {
    const now = Date.now();
    const userKey = `ratelimit:${provider}:user:${userId}`;
    const appKey = `ratelimit:${provider}:app`;

    const pipeline = this.redis.pipeline();

    pipeline.zadd(userKey, now, `${now}-${Math.random()}`);
    pipeline.zremrangebyscore(userKey, 0, now - 60000);
    pipeline.expire(userKey, 120);

    pipeline.zadd(appKey, now, `${now}-${Math.random()}`);
    pipeline.zremrangebyscore(appKey, 0, now - 60000);
    pipeline.expire(appKey, 120);

    await pipeline.exec();
  }

  async handleRateLimitResponse(
    provider: CalendarProvider,
    retryAfterHeader?: string,
  ): Promise<number> {
    let retryAfterMs = 60000;

    if (retryAfterHeader) {
      const seconds = parseInt(retryAfterHeader, 10);
      if (!isNaN(seconds)) {
        retryAfterMs = seconds * 1000;
      }
    }

    const hitKey = `ratelimit:${provider}:hits`;
    await this.redis.incr(hitKey);
    await this.redis.expire(hitKey, 300);

    this.logger.warn(`Rate limit hit for ${provider}, retry after ${retryAfterMs}ms`);

    return retryAfterMs;
  }

  async getStats(provider: CalendarProvider): Promise<{
    appRequestsLastMinute: number;
    rateLimitHits: number;
  }> {
    const now = Date.now();
    const appKey = `ratelimit:${provider}:app`;
    const hitKey = `ratelimit:${provider}:hits`;

    const [appRequests, hits] = await Promise.all([
      this.redis.zcount(appKey, now - 60000, now),
      this.redis.get(hitKey),
    ]);

    return {
      appRequestsLastMinute: appRequests,
      rateLimitHits: parseInt(hits || '0', 10),
    };
  }
}

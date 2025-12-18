import { Module, Controller, Get } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { PrismaClient } from '@prisma/client';

@Controller('health')
export class HealthController {
  private readonly prisma = new PrismaClient();

  constructor(private readonly mailService: MailService) { }

  @Get()
  getHealth() {
    let version = 'unknown';
    try {
      version = require('../../package.json').version;
    } catch (_) { }

    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptimeSec: Math.round(process.uptime()),
      version,
    };
  }

  @Get('ready')
  async getReady() {
    const checks = {
      database: { status: 'unknown' as string },
      mailWebhook: { status: 'unknown' as string },
    };

    // DB check with short timeout
    const dbCheck = (async () => {
      try {
        const dbTimeout = setTimeout(() => {
          throw new Error('DB readiness timeout');
        }, 2000);
        await this.prisma.$queryRaw`SELECT 1`;
        clearTimeout(dbTimeout);
        checks.database = { status: 'healthy' };
      } catch (err) {
        checks.database = { status: 'unhealthy' };
      }
    })();

    // Mail webhook check
    const mailCheck = (async () => {
      try {
        const result = await this.mailService.healthCheck({ timeoutMs: 1500 });
        checks.mailWebhook = result;
      } catch (err) {
        checks.mailWebhook = { status: 'unhealthy' };
      }
    })();

    await Promise.allSettled([dbCheck, mailCheck]);

    const isHealthy = checks.database.status === 'healthy' && checks.mailWebhook.status === 'healthy';

    return {
      status: isHealthy ? 'ready' : 'not-ready',
      ...checks,
      timestamp: new Date().toISOString(),
    };
  }
}

@Module({
  controllers: [HealthController],
  providers: [MailService],
})
export class HealthModule { }


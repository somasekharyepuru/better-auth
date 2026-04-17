import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { EmailQueueService } from '../email-queue/email-queue.service';
import { HealthResponseDto, ReadyResponseDto, EmailQueueStatsDto } from '../common/dto';

@ApiTags('Health')
@Controller()
export class HealthController {
    constructor(private readonly emailQueueService: EmailQueueService) { }

    @Get('health')
    @AllowAnonymous()
    @ApiOperation({ summary: 'Health check endpoint', description: 'Returns overall service health status' })
    @ApiResponse({ status: 200, description: 'Service is healthy', type: HealthResponseDto })
    async health(): Promise<HealthResponseDto> {
        const queueHealthy = await this.emailQueueService.isHealthy();
        return {
            status: queueHealthy ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            services: {
                email: queueHealthy ? 'ok' : 'unhealthy',
            },
        };
    }

    @Get('ready')
    @AllowAnonymous()
    @ApiOperation({ summary: 'Readiness check endpoint', description: 'Returns service readiness status' })
    @ApiResponse({ status: 200, description: 'Service is ready', type: ReadyResponseDto })
    async ready(): Promise<ReadyResponseDto> {
        const queueHealthy = await this.emailQueueService.isHealthy();
        return {
            status: queueHealthy ? 'ready' : 'not-ready',
            service: 'auth-backend',
            email: queueHealthy ? 'ready' : 'unhealthy',
        };
    }

    @Get('queue-stats')
    @AllowAnonymous()
    @ApiOperation({ summary: 'Email queue statistics', description: 'Returns current email queue job statistics (public endpoint, consider restricting in production)' })
    @ApiResponse({ status: 200, description: 'Queue statistics retrieved', type: EmailQueueStatsDto })
    @ApiResponse({ status: 503, description: 'Email worker not ready' })
    async queueStats(): Promise<EmailQueueStatsDto> {
        try {
            const stats = await this.emailQueueService.getStats();
            return stats;
        } catch (error) {
            throw new ServiceUnavailableException({
                error: 'Email worker not ready',
                message: 'Redis connection not established',
            });
        }
    }
}

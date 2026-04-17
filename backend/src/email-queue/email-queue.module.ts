import { Module, Global, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EmailQueueService, emailQueueService } from './email-queue.service';

@Global()
@Module({
    providers: [
        {
            provide: EmailQueueService,
            useValue: emailQueueService,
        },
    ],
    exports: [EmailQueueService],
})
export class EmailQueueModule implements OnModuleInit, OnModuleDestroy {
    constructor() { }

    async onModuleInit() {
        try {
            await emailQueueService.initialize();
        } catch (error) {
            // Log but don't fail startup - email queue is optional
            console.warn('Failed to initialize email queue:', error);
        }
    }

    async onModuleDestroy() {
        await emailQueueService.shutdown();
    }
}

import { Module, Global } from '@nestjs/common';
import { DeviceTrackingService } from './device-tracking.service';
import { PrismaModule } from '../common/prisma.module';
import { EmailQueueModule } from '../email-queue/email-queue.module';

@Global()
@Module({
    imports: [PrismaModule, EmailQueueModule],
    providers: [DeviceTrackingService],
    exports: [DeviceTrackingService],
})
export class DeviceTrackingModule { }

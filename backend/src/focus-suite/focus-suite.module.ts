import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FocusSuiteAnalyticsService } from './focus-suite-analytics.service';
import { FocusSuiteMatrixService } from './focus-suite-matrix.service';
import { FocusSuiteController } from './focus-suite.controller';

@Module({
    imports: [PrismaModule],
    providers: [FocusSuiteAnalyticsService, FocusSuiteMatrixService],
    controllers: [FocusSuiteController],
    exports: [FocusSuiteAnalyticsService, FocusSuiteMatrixService],
})
export class FocusSuiteModule { }

import { Module } from '@nestjs/common';
import { DailyReviewController } from './daily-review.controller';
import { DailyReviewService } from './daily-review.service';
import { DaysModule } from '../days/days.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [DaysModule, SettingsModule],
    controllers: [DailyReviewController],
    providers: [DailyReviewService],
    exports: [DailyReviewService],
})
export class DailyReviewModule { }

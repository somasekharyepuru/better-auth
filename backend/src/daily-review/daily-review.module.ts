import { Module } from '@nestjs/common';
import { DailyReviewController } from './daily-review.controller';
import { DailyReviewService } from './daily-review.service';
import { DaysModule } from '../days/days.module';

@Module({
    imports: [DaysModule],
    controllers: [DailyReviewController],
    providers: [DailyReviewService],
    exports: [DailyReviewService],
})
export class DailyReviewModule { }

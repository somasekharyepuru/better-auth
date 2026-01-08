import { Module } from '@nestjs/common';
import { TimeBlocksController } from './time-blocks.controller';
import { TimeBlocksService } from './time-blocks.service';
import { FocusSessionController } from './focus-session.controller';
import { FocusSessionService } from './focus-session.service';
import { DaysModule } from '../days/days.module';
import { CalendarModule } from '../calendar/calendar.module';

@Module({
    imports: [DaysModule, CalendarModule],
    controllers: [TimeBlocksController, FocusSessionController],
    providers: [TimeBlocksService, FocusSessionService],
    exports: [TimeBlocksService, FocusSessionService],
})
export class TimeBlocksModule { }


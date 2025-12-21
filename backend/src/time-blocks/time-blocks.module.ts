import { Module } from '@nestjs/common';
import { TimeBlocksController } from './time-blocks.controller';
import { TimeBlocksService } from './time-blocks.service';
import { DaysModule } from '../days/days.module';

@Module({
    imports: [DaysModule],
    controllers: [TimeBlocksController],
    providers: [TimeBlocksService],
    exports: [TimeBlocksService],
})
export class TimeBlocksModule { }

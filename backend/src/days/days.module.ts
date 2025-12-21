import { Module } from '@nestjs/common';
import { DaysController } from './days.controller';
import { DaysService } from './days.service';

@Module({
    controllers: [DaysController],
    providers: [DaysService],
    exports: [DaysService],
})
export class DaysModule { }

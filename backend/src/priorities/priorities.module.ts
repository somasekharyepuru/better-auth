import { Module } from '@nestjs/common';
import { PrioritiesController } from './priorities.controller';
import { PrioritiesService } from './priorities.service';
import { DaysModule } from '../days/days.module';

@Module({
    imports: [DaysModule],
    controllers: [PrioritiesController],
    providers: [PrioritiesService],
    exports: [PrioritiesService],
})
export class PrioritiesModule { }

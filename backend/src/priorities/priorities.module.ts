import { Module } from '@nestjs/common';
import { PrioritiesController } from './priorities.controller';
import { PrioritiesService } from './priorities.service';
import { DaysModule } from '../days/days.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [DaysModule, SettingsModule],
    controllers: [PrioritiesController],
    providers: [PrioritiesService],
    exports: [PrioritiesService],
})
export class PrioritiesModule { }

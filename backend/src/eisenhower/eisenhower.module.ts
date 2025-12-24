import { Module } from '@nestjs/common';
import { EisenhowerController } from './eisenhower.controller';
import { EisenhowerService } from './eisenhower.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [SettingsModule],
    controllers: [EisenhowerController],
    providers: [EisenhowerService],
    exports: [EisenhowerService],
})
export class EisenhowerModule { }

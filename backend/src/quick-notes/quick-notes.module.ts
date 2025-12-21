import { Module } from '@nestjs/common';
import { QuickNotesController } from './quick-notes.controller';
import { QuickNotesService } from './quick-notes.service';
import { DaysModule } from '../days/days.module';

@Module({
    imports: [DaysModule],
    controllers: [QuickNotesController],
    providers: [QuickNotesService],
    exports: [QuickNotesService],
})
export class QuickNotesModule { }

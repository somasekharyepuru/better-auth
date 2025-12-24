import { Module } from '@nestjs/common';
import { DiscussionItemsController } from './discussion-items.controller';
import { DiscussionItemsService } from './discussion-items.service';
import { DaysModule } from '../days/days.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [DaysModule, SettingsModule],
    controllers: [DiscussionItemsController],
    providers: [DiscussionItemsService],
    exports: [DiscussionItemsService],
})
export class DiscussionItemsModule { }

import { Module } from '@nestjs/common';
import { EisenhowerController } from './eisenhower.controller';
import { EisenhowerService } from './eisenhower.service';

@Module({
    controllers: [EisenhowerController],
    providers: [EisenhowerService],
    exports: [EisenhowerService],
})
export class EisenhowerModule { }

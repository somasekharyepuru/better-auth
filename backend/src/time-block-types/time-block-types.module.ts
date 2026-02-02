import { Module } from "@nestjs/common";
import { TimeBlockTypesController } from "./time-block-types.controller";
import { TimeBlockTypesService } from "./time-block-types.service";

@Module({
    controllers: [TimeBlockTypesController],
    providers: [TimeBlockTypesService],
    exports: [TimeBlockTypesService],
})
export class TimeBlockTypesModule { }

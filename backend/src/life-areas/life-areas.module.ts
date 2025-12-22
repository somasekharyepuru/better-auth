import { Module } from '@nestjs/common';
import { LifeAreasController } from './life-areas.controller';
import { LifeAreasService } from './life-areas.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [LifeAreasController],
    providers: [LifeAreasService],
    exports: [LifeAreasService],
})
export class LifeAreasModule { }

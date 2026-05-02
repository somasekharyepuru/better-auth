import { Module } from "@nestjs/common";
import { LifeAreasController } from "./life-areas.controller";
import { LifeAreasService } from "./life-areas.service";
import { PrismaModule } from "../prisma/prisma.module";
import { SubscriptionModule } from "../subscription/subscription.module";

@Module({
  imports: [PrismaModule, SubscriptionModule],
  controllers: [LifeAreasController],
  providers: [LifeAreasService],
  exports: [LifeAreasService],
})
export class LifeAreasModule {}

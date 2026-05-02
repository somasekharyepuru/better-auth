import { Module } from "@nestjs/common";
import { PrioritiesController } from "./priorities.controller";
import { PrioritiesService } from "./priorities.service";
import { DaysModule } from "../days/days.module";
import { SubscriptionModule } from "../subscription/subscription.module";

@Module({
  imports: [DaysModule, SubscriptionModule],
  controllers: [PrioritiesController],
  providers: [PrioritiesService],
  exports: [PrioritiesService],
})
export class PrioritiesModule {}

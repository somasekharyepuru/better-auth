import { Module } from "@nestjs/common";
import { DecisionLogController } from "./decision-log.controller";
import { DecisionLogService } from "./decision-log.service";
import { SubscriptionModule } from "../subscription/subscription.module";

@Module({
  imports: [SubscriptionModule],
  controllers: [DecisionLogController],
  providers: [DecisionLogService],
  exports: [DecisionLogService],
})
export class DecisionLogModule {}

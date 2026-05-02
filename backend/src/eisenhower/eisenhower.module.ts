import { Module } from "@nestjs/common";
import { EisenhowerController } from "./eisenhower.controller";
import { EisenhowerService } from "./eisenhower.service";
import { SettingsModule } from "../settings/settings.module";
import { SubscriptionModule } from "../subscription/subscription.module";

@Module({
  imports: [SettingsModule, SubscriptionModule],
  controllers: [EisenhowerController],
  providers: [EisenhowerService],
  exports: [EisenhowerService],
})
export class EisenhowerModule {}

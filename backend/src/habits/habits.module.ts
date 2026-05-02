import { Module } from '@nestjs/common';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [SubscriptionModule],
  controllers: [HabitsController],
  providers: [HabitsService],
  exports: [HabitsService],
})
export class HabitsModule {}

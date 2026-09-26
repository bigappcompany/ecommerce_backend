import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { PaymentService } from '../payment/payment.service';
import { PlanService } from '../plans/plan.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, User])],
  controllers: [SubscriptionController],
  providers: [
    SubscriptionService,
    PaymentService,
    PlanService,
    UsersService,
  ],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}

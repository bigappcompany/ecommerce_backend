import { Module } from '@nestjs/common';
import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [],
  providers: [PlanService],
  controllers: [PlanController],
})
export class PlanModule {}

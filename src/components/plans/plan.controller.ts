import { Controller, Get } from '@nestjs/common';
import { PlanService } from './plan.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('subscription')
@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  getPlans() {
    return this.planService.getPlans();
  }
}

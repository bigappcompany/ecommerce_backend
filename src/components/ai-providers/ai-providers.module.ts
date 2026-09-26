import { Module } from '@nestjs/common';
import { AIProvidersController } from './ai-providers.controller';

@Module({
  controllers: [AIProvidersController],
})
export class AIProvidersModule {}

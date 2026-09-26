// agents.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIService } from '../ai/ai.service';
import { LLMModelController } from './llm-models.controller';
import { User } from '../users/entities/user.entity';
import { LLmModel } from './entities/llmModel.entity';
import { LLMModelServices } from './llm-models.service';

@Module({
  imports: [TypeOrmModule.forFeature([LLmModel,User])],
  controllers: [LLMModelController],
  providers: [LLMModelServices, AIService],
})
export class LLMModelModule {}

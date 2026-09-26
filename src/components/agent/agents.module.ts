// agents.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { Agent } from './entities/agent.entity';
import { Feature } from './entities/feature.entity';
import { AIService } from '../ai/ai.service';
import { User } from '../users/entities/user.entity';
import { LLmModel } from '../llm-models/entities/llmModel.entity';
import { LLMModelServices } from '../llm-models/llm-models.service';
import { PromptResponseService } from '../prompt-response/prompt-response.service';
import { PromptResponse } from '../prompt-response/entities/prompt-response.entity';
import { KnowledgeBase } from '../knowledge-base/entities/knowledge-base.entity';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { VectorStore } from '../vector-store/entities/vector-store.entity';
import { CrawlerService } from '../ai/crawler.service';
import { VectorStoreService } from '../vector-store/vector-store.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agent,
      Feature,
      LLmModel,
      User,
      PromptResponse,
      KnowledgeBase,
      VectorStore,
    ]),
  ],
  controllers: [AgentsController],
  providers: [
    AgentsService,
    LLMModelServices,
    AIService,
    PromptResponseService,
    KnowledgeBaseService,
    VectorStoreService,
    CrawlerService,
  ],
})
export class AgentsModule {}

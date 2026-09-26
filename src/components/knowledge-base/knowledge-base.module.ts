import { KnowledgeBase } from 'src/components/knowledge-base/entities/knowledge-base.entity';
// agents.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIService } from '../ai/ai.service';
import { User } from '../users/entities/user.entity';
import { LLMModelServices } from '../llm-models/llm-models.service';
import { PromptResponseService } from '../prompt-response/prompt-response.service';
import { PromptResponse } from '../prompt-response/entities/prompt-response.entity';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CrawlerService } from '../ai/crawler.service';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { VectorStore } from '../vector-store/entities/vector-store.entity';
import { LLmModel } from '../llm-models/entities/llmModel.entity';
import { VectorStoreService } from '../vector-store/vector-store.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VectorStore,
      User,
      PromptResponse,
      KnowledgeBase,
      LLmModel,
    ]),
  ],
  controllers: [KnowledgeBaseController],
  providers: [
    CrawlerService,
    LLMModelServices,
    AIService,
    PromptResponseService,
    KnowledgeBaseService,
    VectorStoreService,
  ],
})
export class KnowledgeBaseModule {}

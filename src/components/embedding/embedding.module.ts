import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmbeddingService } from './embedding.service';
import { EmbeddingController } from './embedding.controller';
import { Agent } from '../agent/entities/agent.entity';
import { Embedding } from './entities/embedding.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Embedding, Agent, User])],
  controllers: [EmbeddingController],
  providers: [EmbeddingService],
})
export class EmbeddingModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VectorStore } from './entities/vector-store.entity';
import { VectorStoreService } from './vector-store.service';
import { VectorStoreController } from './vector-store.controller';
import { Agent } from '../agent/entities/agent.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VectorStore, Agent, User])],
  controllers: [VectorStoreController],
  providers: [VectorStoreService],
})
export class VectorStoreModule {}

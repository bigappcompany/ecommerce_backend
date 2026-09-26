import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeBase } from './entities/knowledge-base.entity';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { CrawlerService } from '../ai/crawler.service';
import { UpdateKnowledgeBaseDto } from './dto/update-knowledge-base.dto';
import { VectorStore } from '../vector-store/entities/vector-store.entity';
import { CohereEmbeddings } from '@langchain/cohere';

@Injectable()
export class KnowledgeBaseService {
  private embeddings = new CohereEmbeddings({
    apiKey: process.env.COHERE_API_KEY,
    model: 'embed-english-v3.0',
  });

  constructor(
    @InjectRepository(KnowledgeBase)
    private knowledgeBaseRepository: Repository<KnowledgeBase>,
  ) {}

  // Create new knowledge base
  async create(dto: { url: string; name: string; vectorDatabaseId?: string }) {
    return {};
  }

  // Find all knowledge bases for a user
  async findAllByUser(userId: string): Promise<KnowledgeBase[]> {
    return this.knowledgeBaseRepository.find({
      where: { user: { id: userId } },
    });
  }

  // Get knowledge base by ID
  async findOne(id: string): Promise<KnowledgeBase> {
    const knowledgeBase = await this.knowledgeBaseRepository.findOne({
      where: { id },
    });
    if (!knowledgeBase) {
      throw new NotFoundException(`Knowledge base with ID ${id} not found.`);
    }
    return knowledgeBase;
  }

  // Update knowledge base
  async update(
    id: string,
    updateKnowledgeBaseDto: UpdateKnowledgeBaseDto,
  ): Promise<KnowledgeBase> {
    const knowledgeBase = await this.knowledgeBaseRepository.preload({
      id,
      ...updateKnowledgeBaseDto,
    });
    if (!knowledgeBase) {
      throw new NotFoundException(`Knowledge base with ID ${id} not found.`);
    }
    return this.knowledgeBaseRepository.save(knowledgeBase);
  }

  // Delete knowledge base
  async remove(id: string): Promise<void> {
    const knowledgeBase = await this.knowledgeBaseRepository.findOne({
      where: { id },
      relations: ['agents'],
    });

    if (!knowledgeBase) {
      throw new NotFoundException(`Knowledge base with ID ${id} not found.`);
    }

    // Remove links from agents
    if (knowledgeBase.agents) {
      await Promise.all(
        knowledgeBase.agents.map(async (agent) => {
          agent.knowledgeBase = null;
          await this.knowledgeBaseRepository.manager.save(agent);
        }),
      );
    }

    await this.knowledgeBaseRepository.remove(knowledgeBase);
  }
}

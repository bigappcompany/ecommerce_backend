import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromptResponse } from './entities/prompt-response.entity';
import { User } from '../users/entities/user.entity';
import { Agent } from '../agent/entities/agent.entity';

@Injectable()
export class PromptResponseService {
  constructor(
    @InjectRepository(PromptResponse)
    private promptResponseRepository: Repository<PromptResponse>,
  ) {}

  async create(
    prompt: string,
    response: string,
    user: User,
    agent: Agent,
  ): Promise<PromptResponse> {
    const promptResponse = this.promptResponseRepository.create({
      prompt,
      response,
      user,
      agent,
    });
    return this.promptResponseRepository.save(promptResponse);
  }

  async findAllByUser(userId: string): Promise<PromptResponse[]> {
    return this.promptResponseRepository.find({
      where: { user: { id: userId } },
      relations: ['agent'],
    });
  }

  async findAllByAgent(agentId: string): Promise<PromptResponse[]> {
    return this.promptResponseRepository.find({
      where: { agent: { id: agentId } },
      relations: ['user'],
    });
  }
}

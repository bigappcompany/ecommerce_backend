import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PromptResponseService } from './prompt-response.service';
import { User } from '../users/entities/user.entity';
import { Agent } from '../agent/entities/agent.entity';

@Controller('prompt-responses')
export class PromptResponseController {
  constructor(private readonly promptResponseService: PromptResponseService) {}

  @Post()
  async create(
    @Body('prompt') prompt: string,
    @Body('response') response: string,
    @Body('userId') userId: string,
    @Body('agentId') agentId: string,
  ) {
    if (!prompt || !response || !userId || !agentId) {
      throw new BadRequestException(
        'Prompt, response, userId, and agentId are required.',
      );
    }

    // In a real application, you would fetch the user and agent from the database
    const user = { id: userId } as User;
    const agent = { id: agentId } as Agent;

    return this.promptResponseService.create(prompt, response, user, agent);
  }

  @Get('user/:userId')
  async findAllByUser(@Param('userId') userId: string) {
    return this.promptResponseService.findAllByUser(userId);
  }

  @Get('agent/:agentId')
  async findAllByAgent(@Param('agentId') agentId: string) {
    return this.promptResponseService.findAllByAgent(agentId);
  }
}

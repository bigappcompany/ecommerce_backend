// agents.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Res,
  Query,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { FindAllQueryDefaultDTO } from 'src/common/dto/findall-query-default.dto';
import { AIService } from '../ai/ai.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessTokenGuard } from '../auth/passport/jwt-access.guard';
import { PromptAgentDto } from './dto/prompt-agent.dto';
import { PromptResponseService } from '../prompt-response/prompt-response.service';

@ApiTags('Agents')
@ApiBearerAuth()
@UseGuards(JwtAccessTokenGuard)
@Controller('agents')
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly aiService: AIService,
    private readonly promptResponseService: PromptResponseService,
  ) {}

  @Post()
  async create(@Req() req, @Body() createAgentDto: CreateAgentDto, @Res() res) {
    const agents = await this.agentsService.create(req, createAgentDto);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Agent created successfully',
      data: agents,
    });
  }

  @Get()
  async findAll(
    @Req() req,
    @Res() res,
    @Query() findAllQueryDefaultDTO: FindAllQueryDefaultDTO,
  ) {
    const data = await this.agentsService.findAll(req, findAllQueryDefaultDTO);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'agents',
      data: data,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    const agents = await this.agentsService.findOne(id);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'AI Providers',
      data: agents,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAgentDto: UpdateAgentDto,
  ) {
    return await this.agentsService.update(id, updateAgentDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.agentsService.remove(id);
  }

  @Post(':id/prompt')
  async handlePrompt(
    @Req() req,
    @Param('id') id: string,
    @Body() promptAgentDto: PromptAgentDto,
  ): Promise<{ response: string }> {
    const prompt = promptAgentDto.prompt;
    if (!prompt) {
      throw new BadRequestException('Prompt is required.');
    }

    // Fetch the agent by ID
    const agent = await this.agentsService.findOne(id);
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found.`);
    }

    // Fetch the API key for the agent's provider and model
    const apiKey = await this.agentsService.getApiKeyForAgent(agent);
    if (!apiKey) {
      throw new NotFoundException(
        `API key not found for provider: ${agent.provider} and model: ${agent.model}`,
      );
    }
    // Generate the AI response
    const response = await this.aiService.generateResponse(
      agent.provider,
      apiKey,
      agent.model,
      prompt,
      agent.agent_role,
      agent.agent_instructions,
      agent.description,
    );
    const user = req?.user?.id
    await this.promptResponseService.create(prompt, response, user, agent);

    return { response };
  }
}

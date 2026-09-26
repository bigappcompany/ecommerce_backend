// agents.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from './entities/agent.entity';
import { Feature, FeatureType } from './entities/feature.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { FindAllQueryDefaultDTO } from 'src/common/dto/findall-query-default.dto';
import {
  getLimitAndOffsetFromFindQuery,
  getPaginationObject,
} from 'src/common/utils/pagination.util';
import { QueryHelper } from 'src/common/helpers/query.helper';
import { IPagination } from 'src/common/interfaces/pagination.interface';
import { AIService } from '../ai/ai.service';
import { User } from '../users/entities/user.entity';
import { LLMModelServices } from '../llm-models/llm-models.service';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { KnowledgeBase } from '../knowledge-base/entities/knowledge-base.entity';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { CohereEmbeddings } from '@langchain/cohere';
import { CohereClient } from 'cohere-ai';

@Injectable()
export class AgentsService {
  private embeddings = new CohereEmbeddings({
    apiKey: process.env.COHERE_API_KEY,
    model: 'embed-english-v3.0',
  });
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(Feature)
    private readonly featureRepository: Repository<Feature>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(KnowledgeBase)
    private knowledgeBaseRepository: Repository<KnowledgeBase>,

    private knowledgeBaseService: KnowledgeBaseService,
    private userApiKeyService: LLMModelServices,
    private aiService: AIService,
    private vectorDatabaseService: VectorStoreService,
  ) {}

  // Create an agent
  async create(req, createAgentDto: CreateAgentDto): Promise<Agent> {
    const userId = req.user.id;
    // Validate provider and model
    if (!createAgentDto.provider || !createAgentDto.model) {
      throw new BadRequestException('Provider and model are required.');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    // Fetch the API key based on the provider and model
    const apiKey = await this.userApiKeyService.findByProviderAndModel(
      createAgentDto.provider,
      createAgentDto.model,
    );

    if (!apiKey) {
      throw new NotFoundException(
        `API key not found for provider: ${createAgentDto.provider} and model: ${createAgentDto.model}`,
      );
    }

    // Create the agent
    const agent = this.agentRepository.create({
      ...createAgentDto,
      user: user,
      features:
        createAgentDto?.features?.length > 0
          ? createAgentDto?.features?.map((feature) =>
              this.featureRepository.create(feature),
            )
          : [],
    });

    const savedAgent = await this.agentRepository.save(agent);

    // Use the AI service to generate a response
    // const promptResponse = await this.aiService.generateResponse(
    //   createAgentDto.provider,
    //   apiKey.apiKey,
    //   createAgentDto.agentInstructions,
    //   createAgentDto.model,
    // );

    // Log or save the prompt response
    // console.log('Prompt Response:', promptResponse);

    return savedAgent;
  }

  // Get all agents
  async findAll(
    req,
    findAllQueryDefaultDTO: FindAllQueryDefaultDTO,
  ): Promise<any> {
    const { from_date, to_date, search_text, sort_by } = findAllQueryDefaultDTO;
    const { limit, offset } = getLimitAndOffsetFromFindQuery(
      findAllQueryDefaultDTO,
    );
    const userId = req.user.id;
    // Create the query with the necessary filters, limits, and offsets
    let query = this.agentRepository
      .createQueryBuilder('agents')
      .where('agents.userId = :userId', { userId })
      .skip(offset)
      .take(limit);

    const { count, newQuery } = await QueryHelper(
      from_date,
      to_date,
      sort_by,
      search_text,
      ['name'],
      'agents',
      query,
    );

    // Get the pagination object
    const pagination: IPagination = getPaginationObject(limit, offset, count);

    // Execute the query and get the users
    const agents = await newQuery.getMany();

    // Return the agents and pagination information
    return { agents, pagination };
  }

  async update(id: string, updateAgentDto: UpdateAgentDto): Promise<Agent> {
    const { features, ...agentData } = updateAgentDto;
    // Fetch the existing agent
    const agent = await this.findOne(id);
    // Update basic agent fields
    Object.assign(agent, agentData);
    // Update features if provided
    if (features) {
      // Clear existing features
      await this.featureRepository.delete({ agent: { id } });
      // Add new features
      const newFeatures = features.map((featureConfig) => {
        // Ensure the type is correctly mapped to the FeatureType enum
        const feature = this.featureRepository.create({
          ...featureConfig,
          type: FeatureType[featureConfig.type],
          agent, // Associate the feature with the agent
        });
        return feature;
      });
      // Save new features
      await this.featureRepository.save(newFeatures);
      // Associate the features to the agent object
      agent.features = newFeatures;
    }

    // Save the updated agent
    return await this.agentRepository.save(agent);
  }

  // Delete an agent
  async remove(id: string): Promise<void> {
    const agent = await this.findOne(id);

    await this.agentRepository.remove(agent);
  }

  async findOne(id: string): Promise<Agent> {
    const agent = await this.agentRepository.findOne({ where: { id } });
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found.`);
    }
    return agent;
  }

  async getApiKeyForAgent(agent: Agent): Promise<string> {
    const apiKey = await this.userApiKeyService.findByProviderAndModel(
      agent.provider,
      agent.model,
    );
    if (!apiKey) {
      throw new NotFoundException(
        `API key not found for provider: ${agent.provider} and model: ${agent.model}`,
      );
    }
    return apiKey.apiKey;
  }

}

import {
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LLmModel } from './entities/llmModel.entity';
import { CreateLLMModelDto } from './dto/create-llm-model.dto';
import { User } from '../users/entities/user.entity';
import { FindAllQueryDefaultDTO } from 'src/common/dto/findall-query-default.dto';
import {
  getLimitAndOffsetFromFindQuery,
  getPaginationObject,
} from 'src/common/utils/pagination.util';
import { QueryHelper } from 'src/common/helpers/query.helper';
import { IPagination } from 'src/common/interfaces/pagination.interface';
import { UpdateLLMModelDto } from './dto/update-llm-model.dto';

@Injectable()
export class LLMModelServices {
  constructor(
    @InjectRepository(LLmModel)
    private llmModelRepository: Repository<LLmModel>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(req, createUserApiKeyDto: CreateLLMModelDto) {
    let userId = req.user.id;
    const { provider, model, apiKey } = createUserApiKeyDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Check for existing API key with same provider & model for this user
    const existingKey = await this.llmModelRepository.findOne({
      where: { provider, model, user: { id: user.id } },
    });

    if (existingKey) {
      throw new HttpException(
        'API key for this provider and model already exists for this user',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Create a new API key entry
    const userApiKey = this.llmModelRepository.create({
      apiKey,
      provider,
      model,
      user,
    });

    const savedApiKey = await this.llmModelRepository.save(userApiKey);
    return {
      userId: user.id,
      userApiKeyId: savedApiKey.id,
    };
  }

  async update(id: string, updateUserDto: UpdateLLMModelDto) {
    await this.llmModelRepository.update(id, updateUserDto);
    return await this.findOne(id);
  }

  async findByProviderAndModel(
    provider: string,
    model: string,
  ): Promise<LLmModel | null> {
    return this.llmModelRepository.findOne({
      where: { provider, model },
    });
  }

  async findAll(findAllQueryDefaultDTO: FindAllQueryDefaultDTO): Promise<any> {
    const { from_date, to_date, search_text, sort_by } = findAllQueryDefaultDTO;
    const { limit, offset } = getLimitAndOffsetFromFindQuery(
      findAllQueryDefaultDTO,
    );

    // Create the query with the necessary filters, limits, and offsets
    let query = this.llmModelRepository
      .createQueryBuilder('llm-model')
      // .select(['llm-model.apiKey'])
      .skip(offset)
      .take(limit);

    const { count, newQuery } = await QueryHelper(
      from_date,
      to_date,
      sort_by,
      search_text,
      ['provider', 'model'],
      'llm-model',
      query,
    );

    // Get the pagination object
    const pagination: IPagination = getPaginationObject(limit, offset, count);

    // Execute the query and get the users
    const data = await newQuery.getMany();

    // Return the users and pagination information
    return { data, pagination };
  }

  async findOne(id: any): Promise<LLmModel> {
    return this.llmModelRepository.findOne({ where: { id } });
  }

  async remove(id: string) {
    return await this.llmModelRepository.delete(id);
  }

  async AIproviderList(userId: string) {
    const userApiKeys = await this.llmModelRepository.find({
      where: { user: { id: userId } }, // Correct relation lookup
      relations: ['user'], // Include user details if needed
    });
    return userApiKeys.map(({ user, ...rest }) => ({
      ...rest,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    }));
  }
}

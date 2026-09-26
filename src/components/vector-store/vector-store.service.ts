import {
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { FindAllQueryDefaultDTO } from 'src/common/dto/findall-query-default.dto';
import {
  getLimitAndOffsetFromFindQuery,
  getPaginationObject,
} from 'src/common/utils/pagination.util';
import { QueryHelper } from 'src/common/helpers/query.helper';
import { IPagination } from 'src/common/interfaces/pagination.interface';
import { VectorStore } from './entities/vector-store.entity';
import { CreateVectorStoreDto } from './dto/create-vector-store.dto';
import { UpdateVectorStoreDto } from './dto/update-vector-store.dto';

@Injectable()
export class VectorStoreService {
  constructor(
    @InjectRepository(VectorStore)
    private vectorStoreRepository: Repository<VectorStore>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(req, createUserApiKeyDto: CreateVectorStoreDto) {
    let userId = req.user.id;
    const { provider, model, apiKey } = createUserApiKeyDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Check for existing API key with same provider & model for this user
    const existingKey = await this.vectorStoreRepository.findOne({
      where: { provider, model, user: { id: user.id } },
    });

    if (existingKey) {
      throw new HttpException(
        'API key for this provider and model already exists for this user',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Create a new API key entry
    const userApiKey = this.vectorStoreRepository.create({
      apiKey,
      provider,
      model,
      user,
    });

    const savedApiKey = await this.vectorStoreRepository.save(userApiKey);
    return {
      userId: user.id,
      userApiKeyId: savedApiKey.id,
    };
  }

  async update(id: string, updateUserDto: UpdateVectorStoreDto) {
    await this.vectorStoreRepository.update(id, updateUserDto);
    return await this.findOne(id);
  }

  async findByProviderAndModel(
    provider: string,
    model: string,
  ) {
    // return this.vectorStoreRepository.findOne({
    //   where: { provider, model },
    // });
    return {}
  }

  async findAll(findAllQueryDefaultDTO: FindAllQueryDefaultDTO): Promise<any> {
    const { from_date, to_date, search_text, sort_by } = findAllQueryDefaultDTO;
    const { limit, offset } = getLimitAndOffsetFromFindQuery(
      findAllQueryDefaultDTO,
    );

    // Create the query with the necessary filters, limits, and offsets
    let query = this.vectorStoreRepository
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

  async findOne(id: any): Promise<VectorStore> {
    return this.vectorStoreRepository.findOne({ where: { id } });
  }

  async remove(id: string) {
    return await this.vectorStoreRepository.delete(id);
  }

  async AIproviderList(userId: string) {
    const userApiKeys = await this.vectorStoreRepository.find({
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

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
import { WebCrawler } from './entities/web-crawler.entity';
import { LLmModel } from '../llm-models/entities/llmModel.entity';
import { CreateWebCrawlerDto } from './dto/create-web-crawler.dto';
import { UpdateWebCrawlerDto } from './dto/update-web-crawler.dto';

@Injectable()
export class WebCrawlerService {
  constructor(
    @InjectRepository(WebCrawler)
    private webCrawlRepository: Repository<WebCrawler>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(req, createWebCrawlerDto: CreateWebCrawlerDto) {
    let userId = req.user.id;
    const { provider, apiKey } = createWebCrawlerDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Check for existing API key with same provider & model for this user
    const existingKey = await this.webCrawlRepository.findOne({
      where: { provider, user: { id: user.id } },
    });

    if (existingKey) {
      throw new HttpException(
        'API key for this provider and model already exists for this user',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Create a new API key entry
    const userApiKey = this.webCrawlRepository.create({
      apiKey,
      provider,
      user,
    });

    const savedApiKey = await this.webCrawlRepository.save(userApiKey);
    return {
      userId: user.id,
      userApiKeyId: savedApiKey.id,
    };
    return {};
  }

  async update(id: string, updateUserDto: UpdateWebCrawlerDto) {
    await this.webCrawlRepository.update(id, updateUserDto);
    return await this.findOne(id);
  }

  async findByProviderAndModel(
    provider: string,
    model: string,
  ): Promise<WebCrawler | null> {
    return this.webCrawlRepository.findOne({
      where: { provider },
    });
  }

  async findAll(findAllQueryDefaultDTO: FindAllQueryDefaultDTO): Promise<any> {
    const { from_date, to_date, search_text, sort_by } = findAllQueryDefaultDTO;
    const { limit, offset } = getLimitAndOffsetFromFindQuery(
      findAllQueryDefaultDTO,
    );

    // Create the query with the necessary filters, limits, and offsets
    let query = this.webCrawlRepository
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

  async findOne(id: any): Promise<WebCrawler> {
    return this.webCrawlRepository.findOne({ where: { id } });
  }

  async remove(id: string) {
    return await this.webCrawlRepository.delete(id);
  }
}

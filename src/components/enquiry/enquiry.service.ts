import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  getLimitAndOffsetFromFindQuery,
  getPaginationObject,
} from 'src/common/utils/pagination.util';
import { IPagination } from 'src/common/interfaces/pagination.interface';
import { FindAllQueryDefaultDTO } from 'src/common/dto/findall-query-default.dto';
import { QueryHelper } from '../../common/helpers/query.helper';
import { Repository } from 'typeorm';
import { Enquiry } from './entities/enquiry.entity';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { UpdateEnquiryDto } from './dto/update-contact.dto';

@Injectable()
export class EnquiryService {
  constructor(
    @InjectRepository(Enquiry)
    private enquiryRepository: Repository<Enquiry>,
  ) {}

  async findAll(findAllQueryDefaultDTO: FindAllQueryDefaultDTO): Promise<any> {
    const { from_date, to_date, search_text, sort_by } = findAllQueryDefaultDTO;
    const { limit, offset } = getLimitAndOffsetFromFindQuery(
      findAllQueryDefaultDTO,
    );

    // Create the query with the necessary filters, limits, and offsets
    let query = this.enquiryRepository
      .createQueryBuilder('enquiry')
      .select([
        'enquiry.id',
        'enquiry.full_name',
        'enquiry.email',
        'enquiry.phone',
        'enquiry.message',
        'enquiry.status',
        'enquiry.created_at',
        'enquiry.updated_at',
      ])
      .skip(offset)
      .take(limit);

    const { count, newQuery } = await QueryHelper(
      from_date,
      to_date,
      sort_by,
      search_text,
      ['full_name', 'email'],
      'enquiry',
      query,
    );

    // Get the pagination object
    const pagination: IPagination = getPaginationObject(limit, offset, count);

    // Execute the query and get the users
    const enquiries = await newQuery.getMany();

    // Return the enquiries and pagination information
    return { enquiries, pagination };
  }

  async create(createEnquiryDto: CreateEnquiryDto) {
    const user = await this.enquiryRepository.save(createEnquiryDto);
    return this.findById(user.id);
  }

  async update(id: string, updateEnquiryDto: UpdateEnquiryDto) {
    await this.enquiryRepository.update(id, updateEnquiryDto);
    return await this.findById(id);
  }


  async findById(id: string): Promise<Enquiry> {
    const enquiry = await this.enquiryRepository
      .createQueryBuilder('enquiry')
      .where('enquiry.id = :id', { id })
      .getOne();
    if (!enquiry) {
      throw new HttpException('Enquiry Not Found', HttpStatus.NOT_FOUND);
    }
    return enquiry;
  }
}

import { UpdateUserDto } from './dto/update-user.dto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserWithEmailDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from './repositories/user.repository';
import { User } from './entities/user.entity';
import {
  getLimitAndOffsetFromFindQuery,
  getPaginationObject,
} from 'src/common/utils/pagination.util';
import { IPagination } from 'src/common/interfaces/pagination.interface';
import { FindAllQueryDefaultDTO } from 'src/common/dto/findall-query-default.dto';
import { QueryHelper } from '../../common/helpers/query.helper';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: UserRepository,
    private configService: ConfigService,
  ) {}

  async findAll(findAllQueryDefaultDTO: FindAllQueryDefaultDTO): Promise<any> {
    const { from_date, to_date, search_text, sort_by } = findAllQueryDefaultDTO;
    const { limit, offset } = getLimitAndOffsetFromFindQuery(
      findAllQueryDefaultDTO,
    );

    // Create the query with the necessary filters, limits, and offsets
    let query = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.first_name',
        'user.last_name',
        'user.email',
        'user.phone_number',
        'user.created_at',
        'user.updated_at',
        'user.is_active',
        'user.role',
      ])
      .skip(offset)
      .take(limit);

    const { count, newQuery } = await QueryHelper(
      from_date,
      to_date,
      sort_by,
      search_text,
      ['first_name', 'last_name'],
      'user',
      query,
    );

    // Get the pagination object
    const pagination: IPagination = getPaginationObject(limit, offset, count);

    // Execute the query and get the users
    const users = await newQuery.getMany();

    // Return the users and pagination information
    return { users, pagination };
  }

  async create(createUserWithEmail: CreateUserWithEmailDto) {
    const user = await this.userRepository.save(createUserWithEmail);
    return this.findById(user.id);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .select([
        'user.id',
        'user.first_name',
        'user.last_name',
        'user.email',
        'user.phone_number',
        'user.profile_pic',
        'user.created_at',
        'user.updated_at',
        'user.is_active',
        'user.subscription_id',
        'user.subscription_plan',
        'user.is_paid',
        'user.is_free_trail',
        'user.role',
      ])
      .getOne();

    if (!user) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async findMe(req) {
    const userId = req?.user?.id;
    if (!userId) {
      throw new Error('User ID not found');
    }
    const userInfo = await this.findById(userId);
    const response = {
      id: userInfo.id,
      first_name: userInfo.first_name,
      last_name: userInfo.last_name,
      email: userInfo.email,
      phone_number: userInfo.phone_number,
      profile_pic: userInfo.profile_pic,
      is_active: userInfo.is_active,
      subscription_id: userInfo.subscription_id,
      subscription_plan: userInfo.subscription_plan,
      is_paid: userInfo.is_paid,
      is_free_trail: userInfo.is_free_trail,
      role: userInfo.role || 'user',
      created_at: userInfo.created_at,

    };
    return response;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .getOne();
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.userRepository.update(id, updateUserDto);
    return await this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.delete(id);
    if (!user.affected) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
    return;
  }

  async findByIds(ids: string[]) {
    return this.userRepository.findByIds(ids);
  }

  async findUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email: email, is_active: true },
    });
    return user;
  }

  async validateAndFindOneUserByEmail(email: string) {
    const user: any = await this.findByEmail(email);
    if (!user) {
      throw new HttpException('Email Not Found', HttpStatus.BAD_REQUEST);
    }
    return user;
  }

  async updatePassword(id: string, passwordHash: string) {
    console.log(passwordHash,"-------:::password hash",id)
    return this.userRepository.update(id, {
      password: passwordHash,
    });
  }
}

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
import { Subscription } from './entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/subscriptions/create-subscription.dto';
import { PaymentService } from '../payment/payment.service';
import { PlanService } from '../plans/plan.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private readonly razorpayService: PaymentService,
    private readonly planService: PlanService,
    private readonly usersService: UsersService,
  ) {}

  async createSubscription(req, createSubscriptionDto: CreateSubscriptionDto) {
    let userId = req.user.id;
    let findUserInfo = await this.usersService.findById(userId);
    if (!findUserInfo.subscription_id) {
      let getPlanInfo = this.planService.getPlans();
      let planInfo = getPlanInfo.find(
        (item) => item.plan_key === createSubscriptionDto.plan_key,
      );
      const order = await this.razorpayService.createOrder(
        createSubscriptionDto.plan_type === 'month'
          ? planInfo.discounted_monthly_price
          : planInfo.discounted_yearly_price,
      );
      let payment = await this.subscriptionRepository.save({
        ...createSubscriptionDto,
        user_id: userId,
        plan_key: createSubscriptionDto.plan_key,
        order_id: order.id,
      });
      return order;
    } else {
      throw new HttpException('Already subscribed', HttpStatus.BAD_REQUEST);
    }
  }

  async findById(id): Promise<Subscription> {
    const subscription = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .where('subscription.id = :id', { id })
      .getOne();
    if (!subscription) {
      throw new HttpException('Subscription Not Found', HttpStatus.NOT_FOUND);
    }
    return subscription;
  }

  async findAll(findAllQueryDefaultDTO: FindAllQueryDefaultDTO): Promise<any> {
    const { from_date, to_date, search_text, sort_by } = findAllQueryDefaultDTO;
    const { limit, offset } = getLimitAndOffsetFromFindQuery(
      findAllQueryDefaultDTO,
    );

    // Create the query with the necessary filters, limits, and offsets
    let query = this.subscriptionRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.first_name',
        'user.last_name',
        'user.email',
        'user.created_at',
        'user.updated_at',
        'user.is_active',
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

  async findByEmail(email: string): Promise<Subscription> {
    return this.subscriptionRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .getOne();
  }

  async remove(id: string): Promise<void> {
    const user = await this.subscriptionRepository.delete(id);
    if (!user.affected) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
    return;
  }

  async findByIds(ids: string[]) {
    return this.subscriptionRepository.findByIds(ids);
  }

  async validateAndFindOneUserByEmail(email: string) {
    const user: any = await this.findByEmail(email);
    if (!user) {
      throw new HttpException('Email Not Found', HttpStatus.BAD_REQUEST);
    }
    return user;
  }
}

import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Res,
  UseGuards,
  Query,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FindAllQueryDefaultDTO } from 'src/common/dto/findall-query-default.dto';
import { JwtAccessTokenGuard } from '../auth/passport/jwt-access.guard';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/subscriptions/create-subscription.dto';
import { PaymentService } from '../payment/payment.service';

@ApiTags('subscription')
@ApiBearerAuth()
@UseGuards(JwtAccessTokenGuard)
@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly razorpayService: PaymentService,
  ) {}

  @Get()
  async findAll(
    @Res() res,
    @Query() findAllQueryDefaultDTO: FindAllQueryDefaultDTO,
  ) {
    const data = await this.subscriptionService.findAll(findAllQueryDefaultDTO);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Users',
      data: data,
    });
  }

  @Get(':id')
  async findOne(@Res() res, @Param('id') id: string) {
    const mrUser = await this.subscriptionService.findById(id);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'User',
      data: { ...mrUser },
    });
  }

  @Delete(':id')
  async remove(@Res() res, @Param('id') id: string) {
    await this.subscriptionService.remove(id);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Deleted User Successfully',
      data: {},
    });
  }

  //------------------------------------------------------------------------//
  //                             Subscription                               //
  //------------------------------------------------------------------------//
  @Post()
  async createSubscription(
    @Req() req,
    @Res() res,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    const planOption = await this.subscriptionService.createSubscription(
      req,
      createSubscriptionDto,
    );
    return res.status(HttpStatus.CREATED).json({
      statusCode: HttpStatus.CREATED,
      message: 'Created Successfully',
      data: { ...planOption },
    });
  }

  @Post('/verify')
  async verifyPayment(@Req() req, @Body() paymentDetails: any) {
    return this.razorpayService.verifyPayment(req, paymentDetails);
  }
}

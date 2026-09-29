import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAccessTokenGuard } from '../auth/passport/jwt-access.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CheckoutDto, CheckoutSessionDto, ConfirmPaymentDto, UpdateOrderStatusDto } from './dto/shop.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAccessTokenGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @ApiOperation({
    operationId: 'checkoutMyCart',
    summary: 'Checkout the logged-in cart and start Razorpay',
    description: 'Creates a pending order from the signed-in shopper cart. Open Razorpay with the returned key and amount, then call confirm.',
  })
  @ApiOkResponse({ type: CheckoutSessionDto })
  checkout(@Req() req, @Body() body: CheckoutDto) {
    return this.ordersService.checkout(req.user.id, body);
  }

  @Post('confirm')
  @ApiOperation({
    operationId: 'confirmMyPayment',
    summary: 'Finish Razorpay payment for the logged-in shopper',
    description: 'Send the Razorpay success payload. The order status becomes paid and the cart is cleared.',
  })
  confirm(@Req() req, @Body() body: ConfirmPaymentDto) {
    return this.ordersService.confirm(req.user.id, body);
  }

  @Get()
  @ApiOperation({
    operationId: 'listMyOrders',
    summary: 'List orders for the logged-in shopper',
  })
  mine(@Req() req) {
    return this.ordersService.findMine(req.user.id);
  }

  @Get('all')
  @Roles('admin')
  @ApiOperation({
    operationId: 'listAllOrders',
    summary: 'List every order',
  })
  all() {
    return this.ordersService.findAll();
  }

  @Patch(':id/status')
  @Roles('admin')
  @ApiOperation({
    operationId: 'updateOrderStatus',
    summary: 'Update an order status',
  })
  status(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, body.status);
  }
}

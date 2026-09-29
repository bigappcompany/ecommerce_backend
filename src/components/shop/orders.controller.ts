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
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAccessTokenGuard } from '../auth/passport/jwt-access.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CheckoutDto, CheckoutSessionDto, ConfirmPaymentDto } from './dto/shop.dto';
import {
  CancelOrderDto,
  OrderActionsDto,
  RefundOrderDto,
  ReturnOrderDto,
  UpdateAddressDto,
  UpdateOrderStatusDto,
  UpdateRefundStatusDto,
} from './dto/order-journey.dto';
import { OrderActor, OrdersService } from './orders.service';

function actorFromUser(user: { id?: string; role?: string; email?: string }): OrderActor {
  return {
    id: user?.id,
    role: user?.role || 'user',
    name: user?.email,
    allowForce: user?.role === 'admin' || user?.role === 'superadmin',
  };
}

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
    description: 'Send the Razorpay success payload. The order becomes order_received and the cart is cleared. The timeline starts with Order placed, then Order received.',
  })
  confirm(@Req() req, @Body() body: ConfirmPaymentDto) {
    return this.ordersService.confirm(req.user.id, body);
  }

  @Get()
  @ApiOperation({
    operationId: 'listMyOrders',
    summary: 'List orders for the logged-in shopper',
    description: 'Each order includes the shipment journey, the event timeline, and whether cancel, return, or refund is currently allowed.',
  })
  mine(@Req() req) {
    return this.ordersService.findMine(req.user.id);
  }

  @Get('all')
  @Roles('admin', 'store')
  @ApiOperation({
    operationId: 'listAllOrders',
    summary: 'List every order',
    description: 'Superadmin and the store role can list orders. The store role can update shipment status only.',
  })
  all() {
    return this.ordersService.findAll();
  }

  @Get(':id/status')
  @ApiOperation({
    operationId: 'getMyOrderStatus',
    summary: 'Check one order status and timeline',
    description: 'Shoppers can check their own order. Superadmin and store can check any order. actions explains why cancel, return, or refund is blocked.',
  })
  @ApiOkResponse({ type: OrderActionsDto })
  status(@Req() req, @Param('id') id: string) {
    return this.ordersService.getStatus(id, actorFromUser(req.user));
  }

  @Get(':id')
  @ApiOperation({
    operationId: 'getMyOrder',
    summary: 'Get one order, its timeline, and the allowed actions',
  })
  one(@Req() req, @Param('id') id: string) {
    return this.ordersService.getForActor(id, actorFromUser(req.user));
  }

  @Post(':id/cancel')
  @ApiOperation({
    operationId: 'cancelMyOrder',
    summary: 'Cancel an order before it ships',
    description:
      'Allowed for pending, order_received, and packed. Blocked after shipped, in transit, out for delivery, delivered, or once a return or refund has started. Paid cancellations become refund-eligible and stock is returned.',
  })
  @ApiBody({
    type: CancelOrderDto,
    examples: {
      whole: { summary: 'Cancel the whole order', value: { reason: 'Ordered the wrong size' } },
      partial: {
        summary: 'Cancel 1 of 3 items',
        value: { reason: 'One pair is the wrong size', items: [{ item_id: 'item-uuid', quantity: 1 }] },
      },
    },
  })
  cancel(@Req() req, @Param('id') id: string, @Body() body: CancelOrderDto) {
    return this.ordersService.cancelOrder(id, body, actorFromUser(req.user));
  }

  @Patch(':id/address')
  @ApiOperation({
    operationId: 'updateOrderAddress',
    summary: 'Change the delivery address',
    description: 'Customers can change it until the order is packed. Admins can change it until delivery.',
  })
  @ApiBody({ type: UpdateAddressDto })
  updateAddress(@Req() req, @Param('id') id: string, @Body() body: UpdateAddressDto) {
    return this.ordersService.updateAddress(id, body, actorFromUser(req.user));
  }

  @Patch(':id/refund-status')
  @Roles('admin')
  @ApiOperation({
    operationId: 'updateRefundStatus',
    summary: 'Set the refund status, including refund not received',
    description: 'Admin only. Use not_received when the customer says the money never arrived so the refund can be sent again.',
  })
  @ApiBody({
    type: UpdateRefundStatusDto,
    examples: {
      missing: {
        summary: 'Customer did not receive the refund',
        value: { status: 'not_received', note: 'Amount is not in the customer account' },
      },
      received: {
        summary: 'Mark the refund as received',
        value: { status: 'refunded', reference: 'rfnd_manual_1001', note: 'Customer confirmed the credit' },
      },
    },
  })
  updateRefundStatus(@Req() req, @Param('id') id: string, @Body() body: UpdateRefundStatusDto) {
    return this.ordersService.updateRefundStatus(id, body, actorFromUser(req.user));
  }

  @Post(':id/return')
  @ApiOperation({
    operationId: 'requestOrderReturn',
    summary: 'Request a return within 7 days of delivery',
    description: 'Blocked before delivery and after the 7-day window. Superadmin can override the window with the status API and force=true.',
  })
  @ApiBody({ type: ReturnOrderDto })
  requestReturn(@Req() req, @Param('id') id: string, @Body() body: ReturnOrderDto) {
    return this.ordersService.requestReturn(id, body, actorFromUser(req.user));
  }

  @Post(':id/refund')
  @Roles('admin')
  @ApiOperation({
    operationId: 'refundOrder',
    summary: 'Refund a cancelled, returned, or failed captured order',
    description:
      'Superadmin only. The store role cannot refund. Refund is blocked while the order is still active, while a return is in transit, and after a delivered order misses the return window. Omit amount for the remaining balance. Set mark_completed with a reference when the money was sent outside Razorpay.',
  })
  @ApiBody({
    type: RefundOrderDto,
    examples: {
      full: {
        summary: 'Refund the remaining balance through Razorpay',
        value: { note: 'Full refund after cancellation' },
      },
      partial: {
        summary: 'Partial refund',
        value: { amount: 499, note: 'Partial refund for one item' },
      },
      manual: {
        summary: 'Mark a manual refund completed',
        value: { mark_completed: true, reference: 'rfnd_manual_1001', note: 'Transferred to the original payment method' },
      },
    },
  })
  refund(@Req() req, @Param('id') id: string, @Body() body: RefundOrderDto) {
    return this.ordersService.refundOrder(id, body, actorFromUser(req.user));
  }

  @Patch(':id/status')
  @Roles('admin', 'store')
  @ApiOperation({
    operationId: 'updateOrderStatus',
    summary: 'Move an order to the next shipment status',
    description:
      'Store can move one step: received → packed → shipped → in transit → out for delivery → delivered. Failed delivery and warehouse return are side steps. Superadmin can send force=true with a note to correct a mistake. Customers cannot call this.',
  })
  @ApiBody({
    type: UpdateOrderStatusDto,
    examples: {
      packed: {
        summary: 'Mark packed',
        value: { status: 'packed', note: 'Packed at the Bengaluru warehouse', location: 'Bengaluru FC' },
      },
      shipped: {
        summary: 'Mark shipped',
        value: {
          status: 'shipped',
          tracking_id: 'DL1234567890IN',
          carrier: 'Delhivery',
          location: 'Bengaluru hub',
          note: 'Handed to Delhivery',
        },
      },
      transit: {
        summary: 'Mark in transit',
        value: { status: 'in_transit', location: 'Hyderabad hub', note: 'Left the origin hub' },
      },
      delivered: {
        summary: 'Mark delivered',
        value: { status: 'delivered', note: 'Delivered to the customer' },
      },
      correct: {
        summary: 'Superadmin corrects a status',
        value: { status: 'packed', force: true, note: 'Marked shipped by mistake before pickup' },
      },
    },
  })
  statusUpdate(@Req() req, @Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return this.ordersService.updateFulfillment(id, body, actorFromUser(req.user));
  }
}

import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { ApiScopes } from 'src/common/decorators/api-scopes.decorator';
import { ApiKeyGuard } from './api-key.guard';
import { CartService } from './cart.service';
import { OrdersService } from './orders.service';
import { AddCartItemQuery, CustomerLookupQuery, UpdateCartItemQuery } from './dto/customer-lookup.query';
import { ListOrdersQuery } from './dto/list-orders.query';
import { ListProductsQuery } from './dto/list-products.query';
import {
  CheckoutSessionDto,
  IntegrationCartItemDto,
  IntegrationCartQuantityDto,
  IntegrationCheckoutDto,
  IntegrationConfirmPaymentDto,
  ProductUpdateDto,
  ProductWriteDto,
} from './dto/shop.dto';
import { CancelOrderDto, RefundOrderDto, ReturnOrderDto, UpdateAddressDto, UpdateOrderStatusDto, UpdateRefundStatusDto } from './dto/order-journey.dto';
import { ProductsService } from './products.service';

@ApiTags('Integrations')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly ordersService: OrdersService,
    private readonly cartService: CartService,
  ) {}

  @Post('guests')
  @ApiOperation({
    operationId: 'createGuestCart',
    summary: 'Create a guest cart',
    description: 'No request body. Returns a guest token, an empty cart, and a storefront link.',
  })
  @ApiScopes('cart:write')
  async createGuest() {
    const guestToken = randomUUID();
    const cart = await this.cartService.getOrCreate({ guestToken });
    const storefront = process.env.FRONTEND_URL || 'http://localhost:3002';
    return {
      guest_token: guestToken,
      cart,
      storefront_url: `${storefront}/?guest=${guestToken}`,
    };
  }

  @Get('cart')
  @ApiOperation({
    operationId: 'getCartByCustomerEmail',
    summary: 'Get a cart by customer email or phone',
    description:
      'Third-party only. Send email or phone. A cart with no account yet can use guest_token instead. The logged-in shop route does not ask for either.',
  })
  @ApiScopes('cart:read')
  async cart(@Query() query: CustomerLookupQuery) {
    const owner = await this.cartService.ownerFromCustomer({
      guestToken: query.guest_token,
      email: query.email,
      phone: query.phone,
    });
    return this.cartService.getOrCreate(owner);
  }

  @Post('cart/items')
  @ApiOperation({
    operationId: 'addCartItemByCustomerEmail',
    summary: 'Add a product to a cart by customer email or phone',
    description: 'Send email or phone in the body or query. product_id is required. guest_token is only for a shopper who has no account yet.',
  })
  @ApiBody({
    type: IntegrationCartItemDto,
    examples: {
      customer: {
        summary: 'Add by email or phone',
        value: { email: 'user@shop.com', phone: '9876543210', product_id: 'product-uuid', quantity: 1 },
      },
    },
  })
  @ApiScopes('cart:write')
  async addCartItem(@Query() query: AddCartItemQuery, @Body() body: IntegrationCartItemDto) {
    const owner = await this.cartService.ownerFromCustomer({
      guestToken: body?.guest_token || query.guest_token,
      email: body?.email || query.email,
      phone: body?.phone || query.phone,
    });
    const productId = body?.product_id || query.product_id;
    if (!productId) {
      throw new BadRequestException('product_id is required');
    }
    const quantity = body?.quantity ?? (query.quantity ? Number(query.quantity) : undefined);
    return this.cartService.addItem(owner, productId, quantity);
  }

  @Patch('cart/items/:id')
  @ApiOperation({
    operationId: 'updateCartItemByCustomerEmail',
    summary: 'Update a cart item by customer email or phone',
    description: 'Send email or phone so the item is changed on that customer’s cart.',
  })
  @ApiBody({
    type: IntegrationCartQuantityDto,
    examples: {
      customer: { value: { email: 'user@shop.com', phone: '9876543210', quantity: 2 } },
    },
  })
  @ApiScopes('cart:write')
  async updateCartItem(
    @Param('id') id: string,
    @Query() query: UpdateCartItemQuery,
    @Body() body: IntegrationCartQuantityDto,
  ) {
    const owner = await this.cartService.ownerFromCustomer({
      guestToken: body?.guest_token || query.guest_token,
      email: body?.email || query.email,
      phone: body?.phone || query.phone,
    });
    const quantity = body?.quantity ?? (query.quantity != null && query.quantity !== '' ? Number(query.quantity) : undefined);
    if (quantity == null || Number.isNaN(quantity)) {
      throw new BadRequestException('quantity is required');
    }
    return this.cartService.updateItem(owner, id, quantity);
  }

  @Delete('cart/items/:id')
  @ApiOperation({
    operationId: 'removeCartItemByCustomerEmail',
    summary: 'Remove a cart item by customer email or phone',
    description: 'Send email or phone as a query parameter. guest_token works only for a cart with no account.',
  })
  @ApiScopes('cart:write')
  async removeCartItem(@Param('id') id: string, @Query() query: CustomerLookupQuery) {
    const owner = await this.cartService.ownerFromCustomer({
      guestToken: query.guest_token,
      email: query.email,
      phone: query.phone,
    });
    return this.cartService.removeItem(owner, id);
  }

  @Get('products')
  @ApiOperation({
    operationId: 'listPartnerProducts',
    summary: 'List products',
    description: 'Returns 10 products from page 1 unless page and page_size are sent. search and category are optional. No request body.',
  })
  list(@Query() query: ListProductsQuery) {
    return this.productsService.list(query);
  }

  @Get('products/:id')
  one(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post('products')
  @ApiOperation({ operationId: 'createPartnerProduct', summary: 'Create a product' })
  @ApiScopes('products:write')
  create(@Body() body: ProductWriteDto) {
    return this.productsService.create(body);
  }

  @Patch('products/:id')
  @ApiOperation({ operationId: 'updatePartnerProduct', summary: 'Update a product' })
  @ApiScopes('products:write')
  update(@Param('id') id: string, @Body() body: ProductUpdateDto) {
    return this.productsService.update(id, body);
  }

  @Delete('products/:id')
  @ApiScopes('products:delete')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get('orders')
  @ApiOperation({
    operationId: 'getOrdersByCustomerEmail',
    summary: 'List one customer’s orders',
    description:
      'Third-party only. Send email or phone. Returns that customer and their orders. The logged-in shop uses GET /orders and does not send email or phone.',
  })
  @ApiOkResponse({
    schema: {
      example: {
        customer: { id: 'user-uuid', email: 'user@shop.com', first_name: 'Alex', last_name: 'Shopper', phone_number: '9876543210' },
        orders: [{ id: 'order-uuid', order_number: 'order_13', status: 'order_received', total: 3299, items: [] }],
      },
    },
  })
  @ApiScopes('orders:read')
  orders(@Query() query: ListOrdersQuery) {
    return this.ordersService.findByCustomer({ email: query.email, phone: query.phone });
  }

  @Post('checkout')
  @ApiOperation({
    operationId: 'checkoutOrder',
    summary: 'Checkout a customer cart and start Razorpay payment',
    description:
      'Send email or phone_number, plus the delivery address. The delivery phone does not identify the account. Creates a pending order from that cart and returns the Razorpay key, amount in paise, and order id.',
  })
  @ApiBody({
    type: IntegrationCheckoutDto,
    examples: {
      checkout: {
        summary: 'Checkout payload',
        value: {
          email: 'user@shop.com',
          phone_number: '9876543210',
          shipping_name: 'Alex Shopper',
          phone: '9876543210',
          address: '12 Market Road',
          city: 'Bengaluru',
          pincode: '560001',
        },
      },
    },
  })
  @ApiOkResponse({ type: CheckoutSessionDto })
  @ApiScopes('orders:write')
  checkout(@Query() query: CustomerLookupQuery, @Body() body: IntegrationCheckoutDto) {
    return this.ordersService.checkoutForCustomer(
      { email: body.email || query.email, phone: body.phone_number || query.phone },
      body,
    );
  }

  @Post('orders/confirm')
  @ApiOperation({
    operationId: 'confirmOrderPayment',
    summary: 'Finish Razorpay payment and list the customer orders',
    description:
      'Send order_id, razorpay_payment_id, and the customer email or phone. Payment is applied only when that order belongs to the customer.',
  })
  @ApiBody({
    type: IntegrationConfirmPaymentDto,
    examples: {
      confirm: {
        summary: 'Confirm payment payload',
        value: {
          email: 'user@shop.com',
          phone_number: '9876543210',
          order_id: 'order_13',
          razorpay_payment_id: 'pay_123',
          razorpay_order_id: 'order_Rz123',
          razorpay_signature: 'signature',
        },
      },
    },
  })
  @ApiScopes('orders:write')
  confirm(@Query() query: CustomerLookupQuery, @Body() body: IntegrationConfirmPaymentDto) {
    return this.ordersService.confirmForCustomer(
      { email: body.email || query.email, phone: body.phone_number || query.phone },
      body,
    );
  }

  @Get('orders/:id/status')
  @ApiOperation({
    operationId: 'getPartnerOrderStatus',
    summary: 'Check an order status and timeline',
    description:
      'Send email or phone. Returns the status only when the order belongs to that customer.',
  })
  @ApiScopes('orders:read')
  async orderStatus(@Param('id') id: string, @Query() query: CustomerLookupQuery) {
    await this.ordersService.assertPartnerCustomer(id, query);
    return this.ordersService.getStatus(id, { role: 'api', allowForce: false });
  }

  @Get('orders/:id')
  @ApiOperation({
    operationId: 'getPartnerOrder',
    summary: 'Get one customer order',
    description: 'Send email or phone. The order id can be the public order number, such as order_13, or the internal id.',
  })
  @ApiScopes('orders:read')
  order(@Param('id') id: string, @Query() query: CustomerLookupQuery) {
    return this.ordersService.getForPartner(id, query);
  }

  @Post('orders/:id/cancel')
  @ApiOperation({
    operationId: 'cancelPartnerOrder',
    summary: 'Cancel an order before it ships',
    description: 'Blocked after the order is shipped, delivered, or already cancelled.',
  })
  @ApiBody({
    type: CancelOrderDto,
    examples: {
      reason: { value: { email: 'user@shop.com', phone: '9876543210', reason: 'Customer asked to cancel before packing' } },
      partial: { value: { email: 'user@shop.com', reason: 'Cancel one unit', items: [{ item_id: 'item-uuid', quantity: 1 }] } },
    },
  })
  @ApiScopes('orders:write')
  async cancelOrder(@Param('id') id: string, @Query() query: CustomerLookupQuery, @Body() body: CancelOrderDto, @Req() req) {
    await this.ordersService.assertPartnerCustomer(id, this.lookup(query, body));
    return this.ordersService.cancelOrder(id, body, this.apiActor(req));
  }

  @Patch('orders/:id/address')
  @ApiOperation({
    operationId: 'updatePartnerOrderAddress',
    summary: 'Change a delivery address before delivery',
    description: 'Requires orders:write. Blocked after delivery.',
  })
  @ApiBody({ type: UpdateAddressDto })
  @ApiScopes('orders:write')
  async updateAddress(@Param('id') id: string, @Query() query: CustomerLookupQuery, @Body() body: UpdateAddressDto, @Req() req) {
    await this.ordersService.assertPartnerCustomer(id, this.lookup(query));
    return this.ordersService.updateAddress(id, body, this.apiActor(req));
  }

  @Patch('orders/:id/refund-status')
  @ApiOperation({
    operationId: 'updatePartnerRefundStatus',
    summary: 'Set refund status, including refund not received',
    description: 'Requires orders:refund. Use not_received when the customer did not get the money.',
  })
  @ApiBody({ type: UpdateRefundStatusDto })
  @ApiScopes('orders:refund')
  async updateRefundStatus(@Param('id') id: string, @Query() query: CustomerLookupQuery, @Body() body: UpdateRefundStatusDto, @Req() req) {
    await this.ordersService.assertPartnerCustomer(id, this.lookup(query, body));
    return this.ordersService.updateRefundStatus(id, body, this.apiActor(req));
  }

  @Post('orders/:id/return')
  @ApiOperation({
    operationId: 'returnPartnerOrder',
    summary: 'Open a return within 7 days of delivery',
  })
  @ApiBody({ type: ReturnOrderDto, examples: { reason: { value: { reason: 'Customer reported damage on delivery' } } } })
  @ApiScopes('orders:write')
  async returnOrder(@Param('id') id: string, @Query() query: CustomerLookupQuery, @Body() body: ReturnOrderDto, @Req() req) {
    await this.ordersService.assertPartnerCustomer(id, this.lookup(query, body));
    return this.ordersService.requestReturn(id, body, this.apiActor(req));
  }

  @Post('orders/:id/refund')
  @ApiOperation({
    operationId: 'refundPartnerOrder',
    summary: 'Refund a cancelled, returned, or failed captured payment',
    description:
      'Requires orders:refund. Blocked on a live shipment and on a delivered order that was not returned inside 7 days. Use mark_completed and reference when the refund is sent outside Razorpay.',
  })
  @ApiBody({
    type: RefundOrderDto,
    examples: {
      gateway: { value: { note: 'Refund after cancellation' } },
      manual: {
        value: { amount: 1999, mark_completed: true, reference: 'rfnd_manual_1001', note: 'Sent to the original payment method' },
      },
    },
  })
  @ApiScopes('orders:refund')
  async refundOrder(@Param('id') id: string, @Query() query: CustomerLookupQuery, @Body() body: RefundOrderDto, @Req() req) {
    await this.ordersService.assertPartnerCustomer(id, this.lookup(query, body));
    return this.ordersService.refundOrder(id, body, this.apiActor(req));
  }

  @Patch('orders/:id/status')
  @ApiOperation({
    operationId: 'updatePartnerShipmentStatus',
    summary: 'Move an order to the next shipment status',
    description: 'Requires orders:write. A key cannot skip a step or force a status. Send the same status with a note or tracking id to append a timeline update.',
  })
  @ApiBody({
    type: UpdateOrderStatusDto,
    examples: {
      packed: { value: { status: 'packed', note: 'Packed at the Bengaluru warehouse', location: 'Bengaluru FC' } },
      shipped: { value: { status: 'shipped', tracking_id: 'DL1234567890IN', carrier: 'Delhivery', location: 'Bengaluru hub' } },
      transit: { value: { status: 'in_transit', location: 'Hyderabad hub' } },
      delivered: { value: { status: 'delivered', note: 'Delivered to the customer' } },
    },
  })
  @ApiScopes('orders:write')
  async updateShipment(@Param('id') id: string, @Query() query: CustomerLookupQuery, @Body() body: UpdateOrderStatusDto, @Req() req) {
    await this.ordersService.assertPartnerCustomer(id, this.lookup(query, body));
    return this.ordersService.updateFulfillment(id, body, this.apiActor(req));
  }

  @Patch('orders/:id')
  @ApiOperation({ operationId: 'updatePartnerOrderStatus', summary: 'Update an order status' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiScopes('orders:write')
  async updateOrder(@Param('id') id: string, @Query() query: CustomerLookupQuery, @Body() body: UpdateOrderStatusDto, @Req() req) {
    await this.ordersService.assertPartnerCustomer(id, this.lookup(query, body));
    return this.ordersService.updateFulfillment(id, body, this.apiActor(req));
  }

  private lookup(query?: CustomerLookupQuery, body?: object) {
    const source = (body || {}) as { email?: string; phone?: string; phone_number?: string };
    return {
      email: source.email || query?.email,
      phone: source.phone || source.phone_number || query?.phone,
    };
  }

  private apiActor(req): { id?: string; role: 'api'; name?: string; allowForce: false } {
    return {
      id: req.apiKey?.id,
      role: 'api',
      name: req.apiKey?.name,
      allowForce: false,
    };
  }
}

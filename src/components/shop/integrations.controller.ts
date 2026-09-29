import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
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
  UpdateOrderStatusDto,
} from './dto/shop.dto';
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
    summary: 'Get cart by customer email',
    description:
      'Optional query email. Pass the email the customer shared to load that cart. guest_token is an alternative and is also optional.',
  })
  @ApiScopes('cart:read')
  async cart(@Query() query: CustomerLookupQuery) {
    const owner = await this.cartService.ownerFromCustomer({
      guestToken: query.guest_token,
      email: query.email,
    });
    return this.cartService.getOrCreate(owner);
  }

  @Post('cart/items')
  @ApiOperation({
    operationId: 'addCartItemByCustomerEmail',
    summary: 'Add a product to a cart by customer email',
    description:
      'Optional query email. Pass the email the customer shared. product_id can be sent in the query or the body.',
  })
  @ApiScopes('cart:write')
  async addCartItem(@Query() query: AddCartItemQuery, @Body() body: IntegrationCartItemDto) {
    const owner = await this.cartService.ownerFromCustomer({
      guestToken: body?.guest_token || query.guest_token,
      email: body?.email || query.email,
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
    summary: 'Update a cart item by customer email',
    description: 'Optional query email. Pass the email the customer shared.',
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
    summary: 'Remove a cart item by customer email',
    description: 'Optional query email. Pass the email the customer shared.',
  })
  @ApiScopes('cart:write')
  async removeCartItem(@Param('id') id: string, @Query() query: CustomerLookupQuery) {
    const owner = await this.cartService.ownerFromCustomer({
      guestToken: query.guest_token,
      email: query.email,
    });
    return this.cartService.removeItem(owner, id);
  }

  @Get('products')
  @ApiOperation({
    operationId: 'listPartnerProducts',
    summary: 'List products',
    description: 'search and category are optional. No request body.',
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
    summary: 'List orders, optionally for one customer email',
    description:
      'Optional query email. When a customer shares an email, call this API with that email to get their orders, the products on each order, and the status. Omit email to list every order.',
  })
  @ApiScopes('orders:read')
  orders(@Query() query: ListOrdersQuery) {
    if (query.email?.trim()) {
      return this.ordersService.findByEmail(query.email);
    }
    return this.ordersService.findAll();
  }

  @Post('checkout')
  @ApiOperation({
    operationId: 'checkoutOrder',
    summary: 'Checkout a customer cart and start Razorpay payment',
    description:
      'Pass the customer email in the body or as the email query parameter. Creates a pending order from that cart and returns the Razorpay key, amount in paise, and order id. Use key rzp_test_TUonZJyePNzIs5 when the response key is empty. Then call confirmOrderPayment.',
  })
  @ApiOkResponse({ type: CheckoutSessionDto })
  @ApiScopes('orders:write')
  checkout(@Query() query: CustomerLookupQuery, @Body() body: IntegrationCheckoutDto) {
    return this.ordersService.checkoutForCustomer(body.email || query.email, body);
  }

  @Post('orders/confirm')
  @ApiOperation({
    operationId: 'confirmOrderPayment',
    summary: 'Finish Razorpay payment and list the customer orders',
    description:
      'Send order_id and razorpay_payment_id from the Razorpay success handler, plus the customer email. Marks the order paid, clears the cart, and returns every order for that email.',
  })
  @ApiScopes('orders:write')
  confirm(@Query() query: CustomerLookupQuery, @Body() body: IntegrationConfirmPaymentDto) {
    return this.ordersService.confirmForCustomer(body.email || query.email, body);
  }

  @Patch('orders/:id')
  @ApiOperation({ operationId: 'updatePartnerOrderStatus', summary: 'Update an order status' })
  @ApiScopes('orders:write')
  updateOrder(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, body.status);
  }
}

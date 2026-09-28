import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { ApiScopes } from 'src/common/decorators/api-scopes.decorator';
import { ApiKeyGuard } from './api-key.guard';
import { CartService } from './cart.service';
import { OrdersService } from './orders.service';
import { AddCartItemQuery, CustomerLookupQuery, UpdateCartItemQuery } from './dto/customer-lookup.query';
import { ListOrdersQuery } from './dto/list-orders.query';
import { ListProductsQuery } from './dto/list-products.query';
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
  @ApiBody({
    required: false,
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Customer email. Optional if sent as a query parameter.' },
        guest_token: { type: 'string' },
        product_id: { type: 'string' },
        quantity: { type: 'number' },
      },
    },
  })
  @ApiScopes('cart:write')
  async addCartItem(
    @Query() query: AddCartItemQuery,
    @Body() body: { guest_token?: string; email?: string; product_id?: string; quantity?: number },
  ) {
    const owner = await this.cartService.ownerFromCustomer({
      guestToken: body?.guest_token || query.guest_token,
      email: body?.email || query.email,
    });
    const productId = body?.product_id || query.product_id;
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
    @Body() body: { guest_token?: string; email?: string; quantity?: number },
  ) {
    const owner = await this.cartService.ownerFromCustomer({
      guestToken: body?.guest_token || query.guest_token,
      email: body?.email || query.email,
    });
    const quantity = body?.quantity ?? Number(query.quantity);
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
  list(@Query() query: ListProductsQuery) {
    return this.productsService.list(query);
  }

  @Get('products/:id')
  one(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post('products')
  @ApiScopes('products:write')
  create(@Body() body: any) {
    return this.productsService.create(body);
  }

  @Patch('products/:id')
  @ApiScopes('products:write')
  update(@Param('id') id: string, @Body() body: any) {
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
    summary: 'Get orders by customer email',
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

  @Patch('orders/:id')
  @ApiScopes('orders:write')
  updateOrder(@Param('id') id: string, @Body() body: { status: string }) {
    return this.ordersService.updateStatus(id, body.status);
  }
}

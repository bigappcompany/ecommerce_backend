import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { ApiScopes } from 'src/common/decorators/api-scopes.decorator';
import { ApiKeyGuard } from './api-key.guard';
import { CartService } from './cart.service';
import { OrdersService } from './orders.service';
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
  @ApiScopes('cart:read')
  async cart(@Query('guest_token') guestToken?: string, @Query('email') email?: string) {
    const owner = await this.cartService.ownerFromCustomer({ guestToken, email });
    return this.cartService.getOrCreate(owner);
  }

  @Post('cart/items')
  @ApiScopes('cart:write')
  async addCartItem(
    @Body() body: { guest_token?: string; email?: string; product_id: string; quantity?: number },
  ) {
    const owner = await this.cartService.ownerFromCustomer({
      guestToken: body.guest_token,
      email: body.email,
    });
    return this.cartService.addItem(owner, body.product_id, body.quantity);
  }

  @Patch('cart/items/:id')
  @ApiScopes('cart:write')
  async updateCartItem(
    @Param('id') id: string,
    @Body() body: { guest_token?: string; email?: string; quantity: number },
  ) {
    const owner = await this.cartService.ownerFromCustomer({
      guestToken: body.guest_token,
      email: body.email,
    });
    return this.cartService.updateItem(owner, id, body.quantity);
  }

  @Delete('cart/items/:id')
  @ApiScopes('cart:write')
  async removeCartItem(
    @Param('id') id: string,
    @Query('guest_token') guestToken?: string,
    @Query('email') email?: string,
  ) {
    const owner = await this.cartService.ownerFromCustomer({ guestToken, email });
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

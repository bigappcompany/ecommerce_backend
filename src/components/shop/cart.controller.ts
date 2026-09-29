import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAccessTokenGuard } from '../auth/passport/jwt-access.guard';
import { OptionalJwtGuard } from 'src/common/guards/optional-jwt.guard';
import { CartOwner, CartService } from './cart.service';
import { CartItemDto, UpdateCartQuantityDto } from './dto/shop.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-guest-token',
  required: false,
  description: 'Guest cart id. Leave this empty when the shopper is logged in.',
})
@UseGuards(OptionalJwtGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private guestToken(req) {
    const header = req.headers?.['x-guest-token'];
    return Array.isArray(header) ? header[0] : header;
  }

  private owner(req): CartOwner {
    if (req.user?.id) {
      return { userId: req.user.id };
    }
    const guestToken = String(this.guestToken(req) || '').trim();
    if (!/^[A-Za-z0-9-]{16,80}$/.test(guestToken)) {
      throw new BadRequestException('Missing guest session');
    }
    return { guestToken };
  }

  @Get()
  @ApiOperation({ operationId: 'getMyCart', summary: 'Get the current cart' })
  get(@Req() req) {
    return this.cartService.getOrCreate(this.owner(req));
  }

  @Post('merge')
  @UseGuards(JwtAccessTokenGuard)
  merge(@Req() req) {
    return this.cartService.merge(req.user.id, this.guestToken(req));
  }

  @Post('items')
  @ApiOperation({ operationId: 'addMyCartItem', summary: 'Add a product to the cart' })
  add(@Req() req, @Body() body: CartItemDto) {
    return this.cartService.addItem(this.owner(req), body.product_id, body.quantity);
  }

  @Patch('items/:id')
  @ApiOperation({ operationId: 'updateMyCartItem', summary: 'Change a cart item quantity' })
  update(@Req() req, @Param('id') id: string, @Body() body: UpdateCartQuantityDto) {
    return this.cartService.updateItem(this.owner(req), id, body.quantity);
  }

  @Delete('items/:id')
  remove(@Req() req, @Param('id') id: string) {
    return this.cartService.removeItem(this.owner(req), id);
  }
}

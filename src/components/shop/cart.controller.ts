import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { JwtAccessTokenGuard } from '../auth/passport/jwt-access.guard';
import { OptionalJwtGuard } from 'src/common/guards/optional-jwt.guard';
import { CartOwner, CartService } from './cart.service';

@ApiTags('Cart')
@ApiBearerAuth()
@ApiHeader({ name: 'x-guest-token', required: false })
@UseGuards(OptionalJwtGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private owner(req, guestHeader?: string): CartOwner {
    if (req.user?.id) {
      return { userId: req.user.id };
    }
    const guestToken = String(guestHeader || '').trim();
    if (!/^[A-Za-z0-9-]{16,80}$/.test(guestToken)) {
      throw new BadRequestException('Missing guest session');
    }
    return { guestToken };
  }

  @Get()
  get(@Req() req, @Headers('x-guest-token') guestToken?: string) {
    return this.cartService.getOrCreate(this.owner(req, guestToken));
  }

  @Post('merge')
  @UseGuards(JwtAccessTokenGuard)
  merge(@Req() req, @Headers('x-guest-token') guestToken?: string) {
    return this.cartService.merge(req.user.id, guestToken);
  }

  @Post('items')
  add(
    @Req() req,
    @Headers('x-guest-token') guestToken: string,
    @Body() body: { product_id: string; quantity?: number },
  ) {
    return this.cartService.addItem(this.owner(req, guestToken), body.product_id, body.quantity);
  }

  @Patch('items/:id')
  update(
    @Req() req,
    @Headers('x-guest-token') guestToken: string,
    @Param('id') id: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateItem(this.owner(req, guestToken), id, body.quantity);
  }

  @Delete('items/:id')
  remove(@Req() req, @Headers('x-guest-token') guestToken: string, @Param('id') id: string) {
    return this.cartService.removeItem(this.owner(req, guestToken), id);
  }
}

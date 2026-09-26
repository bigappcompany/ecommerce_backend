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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessTokenGuard } from '../auth/passport/jwt-access.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAccessTokenGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  checkout(@Req() req, @Body() body: any) {
    return this.ordersService.checkout(req.user.id, body);
  }

  @Post('confirm')
  confirm(@Req() req, @Body() body: any) {
    return this.ordersService.confirm(req.user.id, body);
  }

  @Get()
  mine(@Req() req) {
    return this.ordersService.findMine(req.user.id);
  }

  @Get('all')
  @Roles('admin')
  all() {
    return this.ordersService.findAll();
  }

  @Patch(':id/status')
  @Roles('admin')
  status(@Param('id') id: string, @Body() body: { status: string }) {
    return this.ordersService.updateStatus(id, body.status);
  }
}

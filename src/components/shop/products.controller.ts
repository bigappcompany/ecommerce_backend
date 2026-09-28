import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtAccessTokenGuard } from '../auth/passport/jwt-access.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { OptionalApiKeyGuard } from './api-key.guard';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiSecurity('api-key')
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @UseGuards(OptionalApiKeyGuard)
  list(@Query('search') search?: string, @Query('category') category?: string) {
    return this.productsService.list({ search, category });
  }

  @Get('inventory')
  @ApiBearerAuth()
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @Roles('admin')
  manage(@Query('search') search?: string, @Query('category') category?: string) {
    return this.productsService.list({ search, category, includeInactive: true });
  }

  @Get(':id')
  @ApiSecurity('api-key')
  @UseGuards(OptionalApiKeyGuard)
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @Roles('admin')
  create(@Body() body: any) {
    return this.productsService.create(body);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: any) {
    return this.productsService.update(id, body);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}

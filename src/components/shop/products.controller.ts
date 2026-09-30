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
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtAccessTokenGuard } from '../auth/passport/jwt-access.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { OptionalApiKeyGuard } from './api-key.guard';
import { ListProductsQuery } from './dto/list-products.query';
import { ProductUpdateDto, ProductWriteDto } from './dto/shop.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    operationId: 'listProducts',
    summary: 'List products',
    description: 'Returns 10 products from page 1 unless page and page_size are sent. search and category are optional. Send x-api-key when calling as a partner.',
  })
  @ApiSecurity('api-key')
  @UseGuards(OptionalApiKeyGuard)
  list(@Query() query: ListProductsQuery) {
    return this.productsService.list(query);
  }

  @Get('inventory')
  @ApiBearerAuth()
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @Roles('admin')
  manage(@Query() query: ListProductsQuery) {
    return this.productsService.list({ ...query, includeInactive: true });
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
  @ApiOperation({ operationId: 'createProduct', summary: 'Create a product' })
  create(@Body() body: ProductWriteDto) {
    return this.productsService.create(body);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAccessTokenGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ operationId: 'updateProduct', summary: 'Update a product' })
  update(@Param('id') id: string, @Body() body: ProductUpdateDto) {
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

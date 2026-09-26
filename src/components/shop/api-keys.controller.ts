import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessTokenGuard } from '../auth/passport/jwt-access.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApiKeysService } from './api-keys.service';

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(JwtAccessTokenGuard, RolesGuard)
@Roles('admin')
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get('scopes')
  scopes() {
    return this.apiKeysService.availableScopes();
  }

  @Get()
  list() {
    return this.apiKeysService.list();
  }

  @Post()
  create(@Body() body: { name: string; scopes: string[] }) {
    return this.apiKeysService.create(body.name, body.scopes);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.apiKeysService.remove(id);
  }
}

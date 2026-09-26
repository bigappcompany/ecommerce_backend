import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  BadRequestException,
  Req,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { UpdateKnowledgeBaseDto } from './dto/update-knowledge-base.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessTokenGuard } from '../auth/passport/jwt-access.guard';

@ApiTags('Knowledge Base')
@ApiBearerAuth()
@UseGuards(JwtAccessTokenGuard)
@Controller('knowledge-base')
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  @Post()
  create(@Body() dto: CreateKnowledgeBaseDto) {
    return this.knowledgeBaseService.create(dto);
  }


  @Get('user/:userId')
  findAllByUser(@Param('userId') userId: string) {
    return this.knowledgeBaseService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.knowledgeBaseService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateKnowledgeBaseDto: UpdateKnowledgeBaseDto,
  ) {
    return this.knowledgeBaseService.update(id, updateKnowledgeBaseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.knowledgeBaseService.remove(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Res,
  Query,
  HttpStatus,
  Req,
  Patch,
} from '@nestjs/common';
import { JwtAccessTokenGuard } from '../auth/passport/jwt-access.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FindAllQueryDefaultDTO } from 'src/common/dto/findall-query-default.dto';
import { EmbeddingService } from './embedding.service';
import { CreateEmbeddingDto } from './dto/create-embedding.dto';
import { UpdateEmbeddingDto } from './dto/update-embedding.dto';

@ApiTags('Embedding')
@ApiBearerAuth()
@UseGuards(JwtAccessTokenGuard)
@Controller('embedding')
export class EmbeddingController {
  constructor(private readonly embeddingService: EmbeddingService) {}

  @Post()
  async create(
    @Res() res,
    @Req() req,
    @Body() createEmbeddingDto: CreateEmbeddingDto,
  ) {
    const embeddings = await this.embeddingService.create(
      req,
      createEmbeddingDto,
    );
    return res.status(HttpStatus.CREATED).json({
      statusCode: HttpStatus.CREATED,
      message: 'Created Successfully',
      data: { ...embeddings },
    });
  }

  @Patch(':id')
  async update(
    @Res() res,
    @Param('id') id: string,
    @Body() updateUserAPIKeyDto: UpdateEmbeddingDto,
  ) {
    const embeddings = await this.embeddingService.update(
      id,
      updateUserAPIKeyDto,
    );
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Updated Successfully',
      data: { ...embeddings },
    });
  }

  @Get()
  async findAll(
    @Res() res,
    @Query() findAllQueryDefaultDTO: FindAllQueryDefaultDTO,
  ) {
    const data = await this.embeddingService.findAll(findAllQueryDefaultDTO);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Embeddings',
      data: data,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.embeddingService.findOne(+id);
  }

  @Delete(':id')
  remove(@Res() res, @Param('id') id: string) {
    const embeddings = this.embeddingService.remove(id);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Deleted Successfully',
      data: { ...embeddings },
    });
  }
}

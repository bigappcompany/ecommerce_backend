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
import { VectorStoreService } from './vector-store.service';
import { CreateVectorStoreDto } from './dto/create-vector-store.dto';
import { UpdateVectorStoreDto } from './dto/update-vector-store.dto';

@ApiTags('Vector Store')
@ApiBearerAuth()
@UseGuards(JwtAccessTokenGuard)
@Controller('vector-store')
export class VectorStoreController {
  constructor(private readonly vectorStoreService: VectorStoreService) {}

  @Post()
  async create(
    @Res() res,
    @Req() req,
    @Body() createVectorStoreDto: CreateVectorStoreDto,
  ) {
    const llmModels = await this.vectorStoreService.create(
      req,
      createVectorStoreDto,
    );
    return res.status(HttpStatus.CREATED).json({
      statusCode: HttpStatus.CREATED,
      message: 'Created Successfully',
      data: { ...llmModels },
    });
  }

  @Patch(':id')
  async update(
    @Res() res,
    @Param('id') id: string,
    @Body() updateUserAPIKeyDto: UpdateVectorStoreDto,
  ) {
    const llmModels = await this.vectorStoreService.update(
      id,
      updateUserAPIKeyDto,
    );
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Updated Successfully',
      data: { ...llmModels },
    });
  }

  @Get()
  async findAll(
    @Res() res,
    @Query() findAllQueryDefaultDTO: FindAllQueryDefaultDTO,
  ) {
    const data = await this.vectorStoreService.findAll(findAllQueryDefaultDTO);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'UserAPIKeys',
      data: data,
    });
  }

  @Get('ai-providers')
  async prov(@Req() req, @Res() res) {
    const providers = await this.vectorStoreService.AIproviderList(req?.user?.id);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'AI Providers',
      data: providers,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vectorStoreService.findOne(+id);
  }

  @Delete(':id')
  remove(@Res() res, @Param('id') id: string) {
    const llmModels = this.vectorStoreService.remove(id);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Deleted Successfully',
      data: { ...llmModels },
    });
  }


}

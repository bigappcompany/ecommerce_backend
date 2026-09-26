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
import { CreateLLMModelDto } from './dto/create-llm-model.dto';
import { JwtAccessTokenGuard } from '../auth/passport/jwt-access.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FindAllQueryDefaultDTO } from 'src/common/dto/findall-query-default.dto';
import { UpdateLLMModelDto } from './dto/update-llm-model.dto';
import { LLMModelServices } from './llm-models.service';

@ApiTags('LLM Models')
@ApiBearerAuth()
@UseGuards(JwtAccessTokenGuard)
@Controller('llm-models')
export class LLMModelController {
  constructor(private readonly userApiKeyService: LLMModelServices) {}

  @Post()
  async create(
    @Res() res,
    @Req() req,
    @Body() createUserApiKeyDto: CreateLLMModelDto,
  ) {
    const llmModels = await this.userApiKeyService.create(
      req,
      createUserApiKeyDto,
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
    @Body() updateUserAPIKeyDto: UpdateLLMModelDto,
  ) {
    const llmModels = await this.userApiKeyService.update(
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
    const data = await this.userApiKeyService.findAll(findAllQueryDefaultDTO);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'UserAPIKeys',
      data: data,
    });
  }

  @Get('ai-providers')
  async prov(@Req() req, @Res() res) {
    const providers = await this.userApiKeyService.AIproviderList(req?.user?.id);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'AI Providers',
      data: providers,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userApiKeyService.findOne(+id);
  }

  @Delete(':id')
  remove(@Res() res, @Param('id') id: string) {
    const llmModels = this.userApiKeyService.remove(id);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Deleted Successfully',
      data: { ...llmModels },
    });
  }


}

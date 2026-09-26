import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { CreateGptModelDto } from './dto/create-gpt-model.dto';
import { GptModelsService } from './gpt-model.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessTokenGuard } from '../auth/passport/jwt-access.guard';

@ApiTags('GPT-Models')
@ApiBearerAuth()
@UseGuards(JwtAccessTokenGuard)
@Controller('gpt-models')
export class GptModelsController {
  constructor(private readonly gptModelsService: GptModelsService) {}
  @Post()
  async addGptModel(
    @Body() createGptModelDto: CreateGptModelDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.gptModelsService.create(
      createGptModelDto.name,
      createGptModelDto.description,
      userId,
    );
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GptModel } from './entities/gpt-model.entity';
import { GptModelsService } from './gpt-model.service';
import { GptModelsController } from './gpt-model.controller';
@Module({
  imports: [TypeOrmModule.forFeature([GptModel])],
  providers: [GptModelsService],
  controllers: [GptModelsController],
})
export class GptModelsModule {}

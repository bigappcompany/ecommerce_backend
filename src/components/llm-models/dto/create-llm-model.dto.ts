import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Provider } from '../entities/llmModel.entity';

export class CreateLLMModelDto {
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(Provider)
  provider: string;

  @IsString()
  @IsNotEmpty()
  model: string;
}

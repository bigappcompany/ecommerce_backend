import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEmbeddingDto {
  @IsNotEmpty()
  @IsString()
  provider: string; // Host URL (if applicable)

  @IsOptional()
  @IsString()
  model: string;

  @IsNotEmpty()
  @IsString()
  apiKey: string; // API key or access token

}
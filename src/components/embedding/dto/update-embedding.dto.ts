import { IsString, IsOptional } from 'class-validator';

export class UpdateEmbeddingDto {
  @IsOptional()
  @IsString()
  provider: string; // Host URL (if applicable)

  @IsOptional()
  @IsString()
  model: string;

  @IsOptional()
  @IsString()
  apiKey: string; // API key or access token
}

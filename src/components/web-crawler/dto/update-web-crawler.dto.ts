import { IsString, IsOptional } from 'class-validator';

export class UpdateWebCrawlerDto {
  @IsOptional()
  @IsString()
  apiKey: string; // API key or access token

  @IsOptional()
  @IsString()
  provider: string;

  @IsOptional()
  @IsString()
  model: string;
}
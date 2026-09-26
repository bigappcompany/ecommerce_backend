import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWebCrawlerDto {
  @IsNotEmpty()
  @IsString()
  apiKey: string; // API key or access token

  @IsNotEmpty()
  @IsString()
  provider: string;
  
  @IsOptional()
  @IsString()
  model: string;
}

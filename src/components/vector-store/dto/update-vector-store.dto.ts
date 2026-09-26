import { IsString, IsOptional } from 'class-validator';

export class UpdateVectorStoreDto {
  @IsOptional()
  @IsString()
  model: string;

  @IsOptional()
  @IsString()
  apiKey: string;

  @IsOptional()
  @IsString()
  provider: string;

  @IsOptional()
  @IsString()
  host: string;
}

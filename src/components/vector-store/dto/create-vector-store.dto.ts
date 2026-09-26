import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVectorStoreDto {
  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @IsNotEmpty()
  @IsString()
  provider: string;

  @IsOptional()
  @IsString()
  host: string;

  @IsOptional()
  @IsString()
  model: string;
}

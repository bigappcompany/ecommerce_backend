import { IsString, IsOptional } from 'class-validator';

export class CreateGptModelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;
}

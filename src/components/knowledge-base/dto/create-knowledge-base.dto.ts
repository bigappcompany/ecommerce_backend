import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateKnowledgeBaseDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  vectorDatabaseId?: string;
}
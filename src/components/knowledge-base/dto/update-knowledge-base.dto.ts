import { IsString, IsOptional } from 'class-validator';

export class UpdateKnowledgeBaseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  vectorDatabaseId?: string;
}
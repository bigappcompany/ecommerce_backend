import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListProductsQuery {
  @ApiPropertyOptional({ description: 'Match name, description, or SKU' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Exact category name' })
  @IsOptional()
  @IsString()
  category?: string;
}

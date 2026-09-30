import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListProductsQuery {
  @ApiPropertyOptional({ description: 'Match name, description, SKU, or category' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Exact category name' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ default: 1, example: 1, description: 'Page number. Defaults to 1.' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 10, example: 10, description: 'How many products to return. Defaults to 10.' })
  @IsOptional()
  page_size?: number;
}

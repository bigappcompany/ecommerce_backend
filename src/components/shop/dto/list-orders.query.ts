import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListOrdersQuery {
  @ApiPropertyOptional({
    description: 'Customer email. Leave empty to list every order.',
  })
  @IsOptional()
  @IsString()
  email?: string;
}

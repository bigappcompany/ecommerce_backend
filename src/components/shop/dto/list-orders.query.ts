import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListOrdersQuery {
  @ApiPropertyOptional({
    description:
      'Customer email. Optional. When a customer shares an email, call this API with that email to get their orders, products, and status. Leave it empty to list every order.',
  })
  @IsOptional()
  @IsString()
  email?: string;
}

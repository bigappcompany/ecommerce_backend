import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListOrdersQuery {
  @ApiPropertyOptional({
    example: 'user@shop.com',
    description:
      'Customer email. Send email or phone. This returns that customer’s orders, products, and status. A third-party key cannot list every order.',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    example: '9876543210',
    description: 'Customer account phone. Send this when email is not available. If it matches more than one account, send the email too.',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}

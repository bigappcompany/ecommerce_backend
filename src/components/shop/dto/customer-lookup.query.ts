import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CustomerLookupQuery {
  @ApiPropertyOptional({
    example: 'user@shop.com',
    description: 'Customer email. Send email or phone. A signed-in shopper does not send this; the login token already identifies them.',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    example: '9876543210',
    description: 'Customer account phone. Send email or phone. Required for a third-party call when email is omitted.',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Guest cart id. Used only for a cart that has no customer yet. An order lookup still needs email or phone.',
  })
  @IsOptional()
  @IsString()
  guest_token?: string;
}

export class AddCartItemQuery extends CustomerLookupQuery {
  @ApiPropertyOptional({ description: 'Product to add. Optional when product_id is in the body.' })
  @IsOptional()
  @IsString()
  product_id?: string;

  @ApiPropertyOptional({ description: 'Quantity. Optional. Defaults to 1.' })
  @IsOptional()
  @IsString()
  quantity?: string;
}

export class UpdateCartItemQuery extends CustomerLookupQuery {
  @ApiPropertyOptional({ description: 'New quantity. Optional when quantity is in the body.' })
  @IsOptional()
  @IsString()
  quantity?: string;
}

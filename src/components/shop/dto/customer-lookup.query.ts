import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CustomerLookupQuery {
  @ApiPropertyOptional({
    description:
      'Customer email. Optional. When a customer shares an email, pass it here. Email is the unique id used to load that customer.',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Guest cart id. Optional when email is provided.',
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

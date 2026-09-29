import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @ApiProperty({ example: 'Alex Shopper' })
  @IsString()
  shipping_name: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '12 Market Road' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '560001' })
  @IsOptional()
  @IsString()
  pincode?: string;
}

export class IntegrationCheckoutDto extends CheckoutDto {
  @ApiPropertyOptional({
    description: 'Customer email. Optional if the email query parameter is set. Email is the unique shopper id.',
    example: 'user@shop.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guest_token?: string;
}

export class ConfirmPaymentDto {
  @ApiProperty({ description: 'Order id returned by checkout' })
  @IsString()
  order_id: string;

  @ApiProperty({ description: 'razorpay_payment_id from the Razorpay success handler' })
  @IsString()
  razorpay_payment_id: string;

  @ApiPropertyOptional({ description: 'razorpay_order_id from the Razorpay success handler' })
  @IsOptional()
  @IsString()
  razorpay_order_id?: string;

  @ApiPropertyOptional({ description: 'razorpay_signature from the Razorpay success handler' })
  @IsOptional()
  @IsString()
  razorpay_signature?: string;
}

export class IntegrationConfirmPaymentDto extends ConfirmPaymentDto {
  @ApiPropertyOptional({
    description: 'Customer email. Optional if the email query parameter is set.',
    example: 'user@shop.com',
  })
  @IsOptional()
  @IsString()
  email?: string;
}

export class CheckoutSessionDto {
  @ApiProperty()
  order_id: string;

  @ApiProperty({ description: 'Amount in paise' })
  amount: number;

  @ApiProperty({ example: 'INR' })
  currency: string;

  @ApiProperty({
    description: 'Public Razorpay key. Same value as RAZORPAY_KEY and VITE_RAZORPAY_KEY.',
    example: 'rzp_test_TUonZJyePNzIs5',
  })
  key: string;

  @ApiProperty({ nullable: true })
  razorpay_order_id: string | null;

  @ApiProperty()
  total: number;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ['paid', 'shipped', 'delivered', 'cancelled', 'failed'] })
  @IsString()
  @IsIn(['paid', 'shipped', 'delivered', 'cancelled', 'failed'])
  status: string;
}

export class ProductWriteDto {
  @ApiProperty({ example: 'Everyday Headphones' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1999 })
  @Type(() => Number)
  @IsNumber()
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  compare_at_price?: number;

  @ApiPropertyOptional({ example: 'Electronics' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stock?: number;

  @ApiProperty({ example: 'BZ-HP-001' })
  @IsString()
  sku: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class ProductUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  compare_at_price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CartItemDto {
  @ApiProperty({ description: 'Product id to add' })
  @IsString()
  product_id: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;
}

export class UpdateCartQuantityDto {
  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsNumber()
  quantity: number;
}

export class IntegrationCartItemDto {
  @ApiPropertyOptional({ example: 'user@shop.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guest_token?: string;

  @ApiPropertyOptional({ description: 'Required in the body when it is not sent as a query parameter' })
  @IsOptional()
  @IsString()
  product_id?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;
}

export class IntegrationCartQuantityDto {
  @ApiPropertyOptional({ example: 'user@shop.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guest_token?: string;

  @ApiPropertyOptional({ description: 'Required in the body when it is not sent as a query parameter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;
}

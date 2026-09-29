import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { MANUAL_STATUSES } from '../order-journey';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: MANUAL_STATUSES,
    example: 'packed',
    description:
      'Next shipment status. The store and an orders:write API key can only move one legal step at a time. Superadmin can send force=true to correct a mistake.',
  })
  @IsString()
  @IsIn([...MANUAL_STATUSES])
  status: string;

  @ApiPropertyOptional({
    example: 'Packed at the Bengaluru warehouse',
    description: 'Shown on the customer timeline. Required when force is true, and required when status is cancelled.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({ example: 'Bengaluru FC' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @ApiPropertyOptional({ example: 'DL1234567890IN' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  tracking_id?: string;

  @ApiPropertyOptional({ example: 'Delhivery' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  carrier?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Superadmin only. Skips the forward-only timeline when a status was applied by mistake. A note is required.',
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export class CancelOrderDto {
  @ApiProperty({
    example: 'Ordered the wrong size',
    description: 'Allowed only while the order is placed, received, or packed. Blocked after it ships.',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;
}

export class ReturnOrderDto {
  @ApiProperty({
    example: 'The product arrived damaged',
    description: 'Allowed for 7 days after delivery. Blocked before delivery and after the window closes.',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;
}

export class RefundOrderDto {
  @ApiPropertyOptional({
    example: 1999,
    description: 'Amount in rupees. Omit to refund whatever is still refundable. Cannot exceed the remaining paid amount.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ example: 'Full refund after cancellation' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({
    example: 'rfnd_manual_1001',
    description: 'Gateway or bank reference. Required when mark_completed is true.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @ApiPropertyOptional({
    example: false,
    description:
      'Set true only after the money has been sent outside this API. Superadmin and an orders:refund key can do this. The store role cannot refund.',
  })
  @IsOptional()
  @IsBoolean()
  mark_completed?: boolean;
}

export class JourneyStepDto {
  @ApiProperty({ example: 'order_received' })
  status: string;

  @ApiProperty({ example: 'Order received' })
  label: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: ['complete', 'current', 'upcoming'], example: 'current' })
  state: string;

  @ApiProperty({ nullable: true })
  at: Date | null;
}

export class OrderTimelineEventDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'packed' })
  status: string;

  @ApiProperty({ example: 'Order packed' })
  label: string;

  @ApiProperty({ nullable: true })
  note: string | null;

  @ApiProperty({ nullable: true })
  location: string | null;

  @ApiProperty({ nullable: true })
  tracking_id: string | null;

  @ApiProperty({ nullable: true })
  carrier: string | null;

  @ApiProperty({ nullable: true, example: 'store' })
  actor_role: string | null;

  @ApiProperty()
  at: Date;
}

export class OrderActionsDto {
  @ApiProperty({ example: true })
  can_cancel: boolean;

  @ApiProperty({ nullable: true, example: null })
  cancel_block_reason: string | null;

  @ApiProperty({ example: false })
  can_request_return: boolean;

  @ApiProperty({
    nullable: true,
    example: 'A return can be requested only after the order is delivered.',
  })
  return_block_reason: string | null;

  @ApiProperty({ example: false })
  can_refund: boolean;

  @ApiProperty({
    nullable: true,
    example: 'Refund is blocked until the order is cancelled. It can still be cancelled before it ships.',
  })
  refund_block_reason: string | null;

  @ApiProperty({ example: 1999 })
  refundable_amount: number;

  @ApiProperty({
    type: 'array',
    example: [{ status: 'packed', label: 'Order packed' }],
  })
  next_statuses: { status: string; label: string }[];
}

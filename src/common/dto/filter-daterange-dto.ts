import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class FilterDateRangeDTO {
  @ApiProperty({ default: '2024-01-01' })
  @IsNotEmpty()
  @IsDateString()
  from_date: string;

  @ApiProperty({ default: '2025-01-01' })
  @IsNotEmpty()
  @IsDateString()
  to_date: string;
}
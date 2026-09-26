import {
  IsUUID,
  IsBoolean,
  ValidateNested,
  IsArray,
  IsOptional,
  ArrayMinSize,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSubscriptionDto {
  @IsUUID()
  @IsOptional()
  id: string;

  @IsString()
  @IsOptional()
  plan_type: string;

  @IsString()
  @IsOptional()
  plan_key: string;

  @IsString()
  @IsOptional()
  start_date: string;

  @IsString()
  @IsOptional()
  end_date: string;

  @IsString()
  @IsOptional()
  is_active: string;

  @IsString()
  @IsOptional()
  is_free_trial: string;
}

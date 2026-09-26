import {
  IsString,
  IsUUID,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { subscriptionEnum } from '../../enums/price.enum';

export class CreateSubscriptionDto {
  @IsUUID()
  @IsOptional()
  id: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(subscriptionEnum)
  plan_type: string;

  @IsString()
  @IsNotEmpty()
  plan_key: string;

  @IsString()
  @IsNotEmpty()
  start_date: string;

  @IsString()
  @IsOptional()
  end_date: string;

  @IsBoolean()
  @IsOptional()
  is_active: boolean;

  @IsBoolean()
  @IsOptional()
  is_free_trial: boolean;
}

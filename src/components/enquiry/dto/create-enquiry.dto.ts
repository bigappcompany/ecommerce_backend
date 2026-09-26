import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { FilterStatusDefaultEnum } from 'src/common/enum/filter.enum';

export class CreateEnquiryDto {
  @IsNotEmpty()
  full_name: string;

  @IsNotEmpty()
  email: string;

  @IsOptional()
  phone: string;

  @IsOptional()
  message: string;

  @IsOptional()
  @IsEnum(FilterStatusDefaultEnum)
  status: string;
}

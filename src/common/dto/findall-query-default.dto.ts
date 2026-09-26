import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import {
  PAGINATION_CONSTANTS,
  SortByDefaultEnum,
} from '../constants/query.constant';

export class FindAllQueryDefaultDTO {
  @IsOptional()
  search_text?: string = '';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page_no?: number = PAGINATION_CONSTANTS.DEFAULT_PAGE_NO;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page_size?: number = PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE;

  @IsOptional()
  from_date?: string;

  @IsOptional()
  to_date?: string;

  @IsOptional()
  @IsEnum(SortByDefaultEnum)
  sort_by?: SortByDefaultEnum = SortByDefaultEnum.NEWEST;
}

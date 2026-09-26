import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { FIND_QUERY_PAGINATION_CONSTANTS } from '../constants/find-query.constant';
// import { GroupByDto } from 'src/packages/smart-filters/dto/group-by-filter.dto';
// import { FilterGroupsDto } from 'src/packages/smart-filters/dto/smart-filter.dto';

export class SortByDto {
  @IsNotEmpty()
  field: string;

  @IsNotEmpty()
  value: string;

  @IsNotEmpty()
  custom: boolean;
}

export class OrderByDto {
  @IsNotEmpty()
  property: string;

  @IsNotEmpty()
  @IsIn(['asc', 'desc'])
  order: string;
}

export class FindQueryDTO {
  @IsOptional()
  search?: string = '';

  @IsOptional()
  @IsInt()
  @Min(FIND_QUERY_PAGINATION_CONSTANTS.DEFAULT_PAGE_NO)
  @Type(() => Number)
  page_no?: number = FIND_QUERY_PAGINATION_CONSTANTS.DEFAULT_PAGE_NO;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  page_size?: number = FIND_QUERY_PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE;

  // @IsOptional()
  // @ValidateNested()
  // @Type(() => OrderByDto)
  // order_by?: OrderByDto;
}

export class FilterOptionsDto {
  @IsOptional()
  @IsNotEmpty()
  has_advance_filter?: boolean;

  @IsOptional()
  @IsNotEmpty()
  has_group_by?: boolean;

  @IsOptional()
  @IsNotEmpty()
  group_by?: any;//GroupByDto

  @IsOptional()
  @IsNotEmpty()
  @ArrayNotEmpty()
  // @Type(() => FilterGroupsDto)
  @ValidateNested({ each: true })
  filter_groups?: any[];//FilterGroupsDto[]

  @IsOptional()
  @IsObject()
  @Type(() => SortByDto)
  @ValidateNested()
  sort_by?: SortByDto;
}

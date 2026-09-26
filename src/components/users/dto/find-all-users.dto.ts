import { IsEnum, IsOptional } from 'class-validator';
import { FindAllQueryDefaultDTO } from 'src/common/dto/findall-query-default.dto';
import { FilterStatusDefaultEnum } from 'src/common/enum/filter.enum';

export class FindAllUsersQueryDTO extends FindAllQueryDefaultDTO {
  @IsOptional()
  @IsEnum(FilterStatusDefaultEnum)
  status?: FilterStatusDefaultEnum;
}

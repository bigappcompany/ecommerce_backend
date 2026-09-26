import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty } from 'class-validator';

export class SingUpFlowDto {
  @IsNotEmpty()
  first_name: string;

  @IsNotEmpty()
  last_name: string;

  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  // @IsStrongPassword()
  @IsNotEmpty()
  password: string;

  @IsIn(['user', 'admin'])
  role: string;
}

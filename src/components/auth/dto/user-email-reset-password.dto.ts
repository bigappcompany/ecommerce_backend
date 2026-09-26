import { IsEmail, IsNotEmpty } from 'class-validator';

export class UserEmailResetPasswordDTO {
  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  password: string;
}

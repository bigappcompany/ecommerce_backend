import {
  Body,
  Controller,
  HttpStatus,
  Inject,
  Post,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SingUpFlowDto } from './dto/user-signup.dto';
import { UserEmailLoginDTO } from './dto/user-email-login.dto';
import { UserEmailForgotPasswordDTO } from './dto/user-email-forgot-password.dto';
import { UserEmailResetPasswordDTO } from './dto/user-email-reset-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async signUpOtpFlowInitiate(
    @Res() res,
    @Body() singUpFlowDto: SingUpFlowDto,
  ) {
    const registerInfo = await this.authService.signUpFlow(singUpFlowDto);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Register Successful',
      data: registerInfo,
    });
  }

  @Post('login')
  async userEmailLogin(
    @Res() res,
    @Body() userEmailLoginDTO: UserEmailLoginDTO,
  ) {
    const loginInfo =
      await this.authService.loginPasswordFlow(userEmailLoginDTO);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Login Successful',
      data: loginInfo,
    });
  }

  @Post('forgot-password')
  async userEmailForgotPassword(
    @Res() res,
    @Body()
    userEmailForgotPasswordDTO: UserEmailForgotPasswordDTO,
  ) {
    let token = await this.authService.userEmailForgotPassword(
      userEmailForgotPasswordDTO,
    );
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Password Reset Link Sent To Email',
      data: {
        token: token,
      },
    });
  }

  @Post('set-password')
  async userEmailSetPassword(
    @Res() res,
    @Body()
    userEmailResetPasswordDTO: UserEmailResetPasswordDTO,
  ) {
    await this.authService.userEmailSetPassword(userEmailResetPasswordDTO);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Password Set Successfully',
      data: {},
    });
  }
}

import { FORGOT_PASSWORD_TEMPLATE } from './../email-manager/templates/forgot-password.template';
import { UserEmailForgotPasswordDTO } from './dto/user-email-forgot-password.dto';
import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SingUpFlowDto } from './dto/user-signup.dto';
import { ConfigService } from '@nestjs/config';
import {
  generateEmailResetCode,
  hashData,
  verifyHashedData,
} from './helpers/auth-helper';
import { UsersService } from '../users/users.service';
import { UserEmailLoginDTO } from './dto/user-email-login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCodeVerification } from './entities/auth-code-verification.entity';
import { AuthCodeVerificationRepository } from './repositories/auth.repository';
import { IResetTokenPayload } from './interfaces/auth.interfaces';
import base64url from 'base64url';
import { UserEmailResetPasswordDTO } from './dto/user-email-reset-password.dto';
import { setPasswordTokenDataValidator } from './validator/auth-validator';
import { ShortCode } from './entities/short-code.entity';
import { Repository } from 'typeorm';
import { EmailManagerService } from '../email-manager/email-manager.service';
import { REGISTER_TEMPLATE } from '../email-manager/templates/register.template';
import { QueuesService } from 'src/queues/queues.service';
import { QueueNames } from 'src/queues/base';
import { toTitleCase } from 'src/common/utils/name.util';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => QueuesService))
    private queueService: QueuesService,
    @InjectRepository(AuthCodeVerification)
    private authCodeVerificationRepository: AuthCodeVerificationRepository,
    @InjectRepository(ShortCode)
    private shortCodeRepository: Repository<ShortCode>,
    private configService: ConfigService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailManagerService: EmailManagerService,
  ) {}

  async generateJWTAccessToken(user: { id: string; role?: string; email?: string }) {
    const payload = {
      id: user.id,
      role: user.role || 'user',
      email: user.email,
    };
    const secret = this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET');
    const expiresIn = this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRY');
    return await this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });
  }

  async signUpFlow(singUpFlowDto: SingUpFlowDto) {
    const { email, password, ...rest } = singUpFlowDto;
    let user;
    const existingUser = await this.usersService.findUserByEmail(email);
    if (existingUser) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }
    user = existingUser;
    // TODO: Implement Password Hashing
    const passwordHash = await hashData(password);
    if (!user) {
      // Create new user
      user = await this.usersService.create({
        first_name: rest.first_name,
        last_name: rest.last_name,
        password: passwordHash,
        email: email,
        profile_pic: [],
        phone_number: '',
        role: rest.role === 'admin' ? 'admin' : 'user',
      } as any);
    } else {
      await this.usersService.update(user.id, {
        password: passwordHash,
        ...rest,
      });
    }
    const access_token = await this.generateJWTAccessToken(user);
    //----- queue implementation ---------//
    this.sendQueueMessage(user);
    return {
      access_token: access_token,
      user: {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        id: user.id,
        role: user.role || 'user',
      },
    };
  }

  async loginPasswordFlow(userEmailLoginDTO: UserEmailLoginDTO) {
    let user;
    user = await this.usersService.findUserByEmail(userEmailLoginDTO.email);
    if (!user) {
      throw new HttpException('User Not Found', HttpStatus.BAD_REQUEST);
    }
    const isCorrectPassword = await verifyHashedData(
      userEmailLoginDTO.password,
      user.password,
    );
    if (!isCorrectPassword) {
      throw new HttpException('Incorrect Password', HttpStatus.BAD_REQUEST);
    }
    const access_token = await this.generateJWTAccessToken(user);
    return {
      access_token: access_token,
      user: {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        id: user.id,
        role: user.role || 'user',
      },
    };
  }

  async userEmailForgotPassword(
    userEmailForgotPasswordDTO: UserEmailForgotPasswordDTO,
  ) {
    const user = await this.usersService.validateAndFindOneUserByEmail(
      userEmailForgotPasswordDTO.email,
    );
    return await this.userEmailChangePasswordLink(user);
  }

  async userEmailChangePasswordLink(user) {
    const authCode = await this.authCodeVerificationRepository.findOne({
      where: {
        user_id: user.id,
      },
    });
    if (authCode) {
      await this.authCodeVerificationRepository.delete(authCode.id);
    }
    const setPasswordCode = generateEmailResetCode();
    const setPasswordCodeHash = await hashData(setPasswordCode);
    let authCodeData = {
      code_hash: setPasswordCodeHash,
      user_id: user?.id,
    };
    await this.authCodeVerificationRepository.save(authCodeData);
    const tokenPayload: IResetTokenPayload = {
      code: setPasswordCode,
      user_id: user?.id,
    };
    const token = base64url(JSON.stringify(tokenPayload));
    const shortCode = await this.createShortCode({ code: token });
    if (!shortCode)
      throw new HttpException('Short code add failed', HttpStatus.BAD_REQUEST);
    const setPasswordLink = `${this.configService.get<string>(
      'APP_FRONTEND_URL',
    )}/auth/set-password?token=${token}`;
    let template = FORGOT_PASSWORD_TEMPLATE;
    this.emailManagerService
      .sendTemplateEmail({
        template,
        to_emails: [user?.email],
        data: {
          user: { ...user, reset_link: setPasswordLink },
        },
      })
      .catch((err) => {
        console.log(err);
        // this.logger.error(err);
      });
    return true;
    // return setPasswordLink;
  }

  async userEmailSetPassword(
    userEmailResetPasswordDTO: UserEmailResetPasswordDTO,
  ) {
    let tokenData: IResetTokenPayload;
    try {
      tokenData = JSON.parse(base64url.decode(userEmailResetPasswordDTO.token));
      await setPasswordTokenDataValidator.validateAsync(tokenData);
    } catch (err) {
      throw new HttpException('Reset Token Invalid', HttpStatus.BAD_REQUEST);
    }
    const { code, user_id } = tokenData;
    const authCode = await this.authCodeVerificationRepository
      .createQueryBuilder('auth_code_verification')
      .select([
        'id',
        `auth_code_verification.code_hash as "code_hash"`,
        `auth_code_verification.user_id as "user_id"`,
      ])
      .addSelect(
        `("created_at" + interval '${this.configService.get<number>(
          'RESET_PASSWORD_TOKEN_EXPIRY_DAYS',
        )} days') <= now()  as "isExpired"`,
      )
      .andWhere('auth_code_verification.user_id = :user_id', { user_id })
      .getRawOne();
    if (!authCode) {
      throw new HttpException('Reset Token Invalid 1', HttpStatus.BAD_REQUEST);
    }
    if (authCode.isExpired) {
      await this.authCodeVerificationRepository.delete(authCode.id);
      throw new HttpException('Reset Token Expired', HttpStatus.BAD_REQUEST);
    }
    const isValidCode = await verifyHashedData(code, authCode.code_hash);
    if (!isValidCode) {
      throw new HttpException('Reset Token Invalid 2', HttpStatus.BAD_REQUEST);
    }
    const passwordHash = await hashData(userEmailResetPasswordDTO.password);
    const updatedCorporateUser = await this.usersService.updatePassword(
      authCode.user_id,
      passwordHash,
    );
    await this.authCodeVerificationRepository.delete(authCode.id);
    if (updatedCorporateUser.affected) {
      return true;
    } else {
      throw new HttpException('Password Reset Failed', HttpStatus.BAD_REQUEST);
    }
  }
  async createShortCode(createShortCodeDto) {
    return await this.shortCodeRepository.save(createShortCodeDto);
  }

  async findShortCodeById(code: string): Promise<ShortCode> {
    return await this.shortCodeRepository.findOne({ where: { code } });
  }

  async deleteShortCode(id: string) {
    return await this.shortCodeRepository.delete(id);
  }

  // ------------------------ Queue Implimentation ------------------//
  async sendQueueMessage(user) {
    this.queueService.pushMessage<any>(QueueNames.RegistrationInvitation, user);
    return { queued: true };
  }

  async sendRegistrationInvite(user) {
    this.emailManagerService.sendTemplateEmail({
      template: REGISTER_TEMPLATE,
      to_emails: [user.email],
      data: {
        user: { first_name: user.first_name },
      },
    });
  }

  // Method to extract and verify token
  verifyToken(token: string): any {
    try {
      // Verify the token and return the payload (user info)
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  // Method to extract the token from the request headers
  getTokenFromRequest(req: any): string | null {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7, authHeader.length); // Remove 'Bearer ' from string
    }
    return null;
  }

  // Method to get user info from the token
  getUserFromToken(req: any): any {
    const token = this.getTokenFromRequest(req);
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }
    return this.verifyToken(token); // Returns the decoded user info
  }
}

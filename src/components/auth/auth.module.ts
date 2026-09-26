import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAccessTokenStrategy } from './passport/jwt.strategy';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthCodeVerification } from './entities/auth-code-verification.entity';
import { ShortCode } from './entities/short-code.entity';
import { EmailManagerModule } from '../email-manager/email-manager.module';
import { QueuesModule } from 'src/queues/queues.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthCodeVerification, ShortCode]),
    UsersModule,
    forwardRef(() => QueuesModule),
    EmailManagerModule,
    PassportModule.register({ defaultStrategy: 'jwt-access-token' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRY') || '7d',
        },
      }),
    }),
  ],
  exports: [AuthService],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessTokenStrategy],
})
export class AuthModule {}

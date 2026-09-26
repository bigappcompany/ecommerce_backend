import { Module } from '@nestjs/common';
import { EmailManagerService } from './email-manager.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

// @Module({
//   imports: [
//     MailerModule.forRootAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: (configService: ConfigService) => ({
//         transport: {
//           host: configService.get<string>('SMTP_HOST'),
//           port: configService.get<number>('SMTP_PORT'),
//           ignoreTLS: configService.get<boolean>('SMTP_IGNORE_TLS'),
//           secure: false,
//           auth: {
//             user: configService.get<string>('SMTP_USERNAME'),
//             pass: configService.get<string>('SMTP_PASSWORD'),
//           },
//         },
//         defaults: {
//           from: configService.get<string>('EMAIL_FROM'),
//         },
//         preview: true,
//       }),
//     }),
//   ],
//   providers: [EmailManagerService],
//   exports: [EmailManagerService],
// })
// export class EmailManagerModule {}

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('SMTP_HOST'),
          port: configService.get<number>('SMTP_PORT'),
          ignoreTLS: configService.get<boolean>('SMTP_IGNORE_TLS'),
          secure: false,
          auth: {
            user: configService.get<string>('SMTP_USERNAME'),
            pass: configService.get<string>('SMTP_PASSWORD'),
          },
        },
        defaults: {
          from: configService.get<string>('EMAIL_FROM'),
        },
        preview: true,
      }),
    }),
  ],
  providers: [EmailManagerService],
  exports: [EmailManagerService],
})
export class EmailManagerModule {}


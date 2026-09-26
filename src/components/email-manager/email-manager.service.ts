// import { Injectable } from '@nestjs/common';
// import * as _ from 'lodash';
// import { MailerService } from '@nestjs-modules/mailer';
// import { EmailTemplateBodyTypesEnum } from './enums/email-manager.enum';
// import { ISendTemplatePayload } from './interfaces/email-manager.interface';

// @Injectable()
// export class EmailManagerService {
//   constructor(private readonly mailerService: MailerService) {}

//   private async sendEmail(emailData): Promise<void> {
//     return this.mailerService.sendMail(emailData).catch(console.error);
//   }

//   async sendEmailWithRawPayload(emailData) {
//     return this.mailerService.sendMail(emailData).catch(console.error);
//   }

//   async sendTemplateEmail(sendTemplateEmailPayload: ISendTemplatePayload) {
//     const template = sendTemplateEmailPayload.template;
//     const subjectCompiled = _.template(template.subject);
//     const bodyCompiled = _.template(template.body);

//     const emailData: any = {
//       to: sendTemplateEmailPayload.to_emails,
//       subject: subjectCompiled(sendTemplateEmailPayload.data),
//     };
//     if (template.body_type === EmailTemplateBodyTypesEnum.TEXT) {
//       emailData.text = bodyCompiled(sendTemplateEmailPayload.data);
//     }
//     if (template.body_type === EmailTemplateBodyTypesEnum.HTML) {
//       emailData.html = bodyCompiled(sendTemplateEmailPayload.data);
//     }
//     return await this.sendEmail(emailData);
//   }
// }


import { Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailTemplateBodyTypesEnum } from './enums/email-manager.enum';
import { ISendTemplatePayload } from './interfaces/email-manager.interface';
import type { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailManagerService {
  private resend: Resend;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  private useResend(): boolean {
    return String(this.configService.get('USE_RESEND')).toLowerCase() === 'true';
  }

  private getResend(): Resend {
    if (!this.resend) {
      const { Resend } = require('resend');
      this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
    }
    return this.resend;
  }

  private async sendEmail(emailData): Promise<void> {
    return this.mailerService.sendMail(emailData).catch(console.error);
  }

  private async sendEmailWithResend(emailData): Promise<void> {
    await this.getResend().emails.send({
      from: emailData.from || this.configService.get<string>('EMAIL_FROM'),
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
    }).catch(console.error);
  }

  async sendEmailWithRawPayload(emailData) {
    // Decide which service to use based on config or other logic
    if (this.useResend()) {
      return this.sendEmailWithResend(emailData);
    } else {
      return this.mailerService.sendMail(emailData).catch(console.error);
    }
  }

  async sendTemplateEmail(sendTemplateEmailPayload: ISendTemplatePayload) {
    const template = sendTemplateEmailPayload.template;
    const subjectCompiled = _.template(template.subject);
    const bodyCompiled = _.template(template.body);

    const emailData: any = {
      to: sendTemplateEmailPayload.to_emails,
      subject: subjectCompiled(sendTemplateEmailPayload.data),
    };
    if (template.body_type === EmailTemplateBodyTypesEnum.TEXT) {
      emailData.text = bodyCompiled(sendTemplateEmailPayload.data);
    }
    if (template.body_type === EmailTemplateBodyTypesEnum.HTML) {
      emailData.html = bodyCompiled(sendTemplateEmailPayload.data);
    }

    if (this.useResend()) {
      return await this.sendEmailWithResend(emailData);
    } else {
      return await this.sendEmail(emailData);
    }
  }
}

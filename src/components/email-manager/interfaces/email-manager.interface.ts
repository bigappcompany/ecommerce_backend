import { EmailTemplateBodyTypesEnum } from '../enums/email-manager.enum';

export interface IEmailTemplate {
  subject: string;
  body: string;
  body_type: EmailTemplateBodyTypesEnum;
}

export interface ISendTemplatePayload {
  template: IEmailTemplate;
  to_emails: string[];
  data: Object;
  attachment_keys?: string[];
}

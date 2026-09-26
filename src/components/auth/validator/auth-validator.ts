import * as Joi from 'joi';
import { AuthCodeVerificationTypeEnum } from '../constants/auth.enum';

export const setPasswordTokenDataValidator = Joi.object({
  // type: Joi.string().valid(...Object.values(AuthCodeVerificationTypeEnum)),
  code: Joi.string().alphanum().required(),
  user_id: Joi.string(),
});

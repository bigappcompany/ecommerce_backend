import {
    AuthCodeVerificationTypeEnum,
    AuthUserTypeEnum,
  } from '../constants/auth.enum';
  
  export interface IJwtAccessToken {
    id: string;
    userType: AuthUserTypeEnum;
    roleId?: string;
  }
  
  export interface IResetTokenPayload {
    // type: AuthCodeVerificationTypeEnum;
    code: string;
    user_id: string;
  }
  
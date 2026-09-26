import { hash, compare } from 'bcryptjs';
import { BCRYPY_SALT_ROUNDS } from '../constants/auth.constants';
import * as crypto from 'crypto';

export async function hashData(data) {
  const hashedPassword = await hash(data, BCRYPY_SALT_ROUNDS);
  return hashedPassword;
}

export async function verifyHashedData(data, hashedData) {
  const isValid = await compare(data, hashedData);
  return isValid;
}




export function generateEmailResetCode() {
  return crypto.randomBytes(32).toString('hex');
}

export function isStrongPassword(pwd: string) {
  // Password must contain at least one lowercase letter, one uppercase letter,
  // one digit, one special character, and be at least 8 characters long.
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$#!%*?&]{8,}$/;

  return strongPasswordRegex.test(pwd);
}

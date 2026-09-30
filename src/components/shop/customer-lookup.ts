import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

export type CustomerLookup = {
  email?: string;
  phone?: string;
};

const CUSTOMER_FIELDS = ['user.id', 'user.email', 'user.first_name', 'user.last_name', 'user.phone_number'];

export function normalizePhone(value?: string) {
  return String(value || '').replace(/\D/g, '');
}

export function phonesMatch(stored?: string | null, given?: string) {
  const left = normalizePhone(stored || '');
  const right = normalizePhone(given);
  if (!left || !right) return false;
  if (left === right) return true;
  return left.length >= 10 && right.length >= 10 && left.slice(-10) === right.slice(-10);
}

export async function findCustomer(users: Repository<User>, lookup: CustomerLookup) {
  const email = String(lookup.email || '').trim().toLowerCase();
  const phone = normalizePhone(lookup.phone);
  if (!email && !phone) {
    throw new BadRequestException('Send the customer email or phone number');
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestException('Enter a valid email');
  }
  if (phone && phone.length < 8) {
    throw new BadRequestException('Enter a valid phone number');
  }

  if (email) {
    const user = await users
      .createQueryBuilder('user')
      .select(CUSTOMER_FIELDS)
      .where('LOWER(user.email) = :email', { email })
      .getOne();
    if (!user) {
      throw new NotFoundException('Customer not found');
    }
    if (phone && !phonesMatch(user.phone_number, phone)) {
      throw new BadRequestException('That phone number does not match this email');
    }
    return user;
  }

  const digits = `regexp_replace(coalesce("user"."phone_number", ''), '\\D', '', 'g')`;
  const matches = await users
    .createQueryBuilder('user')
    .select(CUSTOMER_FIELDS)
    .where(
      `(${digits} = :phone OR (length(:phone) >= 10 AND length(${digits}) >= 10 AND right(${digits}, 10) = right(:phone, 10)))`,
      { phone },
    )
    .getMany();
  if (!matches.length) {
    throw new NotFoundException('Customer not found');
  }
  if (matches.length > 1) {
    throw new BadRequestException('That phone number matches more than one customer. Send the email as well.');
  }
  return matches[0];
}

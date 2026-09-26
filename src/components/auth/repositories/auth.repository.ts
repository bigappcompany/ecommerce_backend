import { EntityRepository, Repository } from 'typeorm';
import { AuthCodeVerification } from '../entities/auth-code-verification.entity';

@EntityRepository(AuthCodeVerification)
export class AuthCodeVerificationRepository extends Repository<AuthCodeVerification> {}

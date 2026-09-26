import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt-access-token') {
  handleRequest(_err: any, user: any) {
    return user || null;
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { API_SCOPES_KEY } from 'src/common/decorators/api-scopes.decorator';
import { ApiKeysService } from './api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const raw = request.headers['x-api-key'];
    if (!raw || typeof raw !== 'string') {
      throw new UnauthorizedException('Send your API key in the x-api-key header');
    }
    const record = await this.apiKeysService.validate(raw);
    const required =
      this.reflector.getAllAndOverride<string[]>(API_SCOPES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];
    const missing = required.filter((scope) => !(record.scopes || []).includes(scope));
    if (missing.length) {
      throw new ForbiddenException(`API key is missing scope: ${missing.join(', ')}`);
    }
    request.apiKey = {
      id: record.id,
      name: record.name,
      scopes: record.scopes,
    };
    return true;
  }
}

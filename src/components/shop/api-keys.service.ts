import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { ApiCredential } from './entities/api-key.entity';
import { createApiKeyMaterial } from './orders.service';
import { PRODUCT_SCOPES } from './products.service';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiCredential)
    private readonly keys: Repository<ApiCredential>,
  ) {}

  private hash(raw: string) {
    return createHash('sha256').update(raw).digest('hex');
  }

  availableScopes() {
    return PRODUCT_SCOPES;
  }

  async list() {
    const keys = await this.keys
      .createQueryBuilder('key')
      .addSelect('key.token')
      .orderBy('key.created_at', 'DESC')
      .getMany();
    return keys.map((key) => ({
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      api_key: key.token || null,
      scopes: key.scopes,
      is_active: key.is_active,
      last_used_at: key.last_used_at,
      created_at: key.created_at,
    }));
  }

  async create(name: string, scopes: string[]) {
    const selected = (scopes || []).filter((scope) => PRODUCT_SCOPES.includes(scope));
    if (!name || !selected.length) {
      throw new BadRequestException('Name and at least one scope are required');
    }
    const raw = createApiKeyMaterial();
    const saved = await this.keys.save(
      this.keys.create({
        name,
        prefix: raw.slice(0, 10),
        key_hash: this.hash(raw),
        token: raw,
        scopes: selected,
        is_active: true,
      }),
    );
    return {
      id: saved.id,
      name: saved.name,
      prefix: saved.prefix,
      scopes: saved.scopes,
      api_key: raw,
    };
  }

  async remove(id: string) {
    const key = await this.keys.findOne({ where: { id } });
    if (!key) {
      return { deleted: false };
    }
    await this.keys.remove(key);
    return { deleted: true };
  }

  async validate(raw: string) {
    const record = await this.keys
      .createQueryBuilder('key')
      .addSelect('key.key_hash')
      .where('key.key_hash = :hash', { hash: this.hash(raw) })
      .andWhere('key.is_active = true')
      .getOne();
    if (!record) {
      throw new UnauthorizedException('Invalid API key');
    }
    record.last_used_at = new Date();
    await this.keys.update(record.id, { last_used_at: record.last_used_at });
    return record;
  }
}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('TYPEORM_HOST') || '127.0.0.1',
        port: Number(configService.get('TYPEORM_PORT') || 5432),
        username: configService.get<string>('TYPEORM_USERNAME'),
        password: configService.get<string>('TYPEORM_PASSWORD') ?? '',
        database: configService.get<string>('TYPEORM_DATABASE'),
        entities: [configService.get<string>('TYPEORM_ENTITIES')],
        synchronize: configService.get('TYPEORM_SYNCHRONIZE') === 'true',
        migrations: [configService.get<string>('TYPEORM_MIGRATIONS')],
        migrationsRun: configService.get('TYPEORM_MIGRATIONS_RUN') === 'true',
        logging: configService.get('TYPEORM_LOGGING') === 'true',
      }),
    }),
  ],
})
export class DatabaseModule {}

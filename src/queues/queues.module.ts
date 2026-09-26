import { DynamicModule, Module, forwardRef } from '@nestjs/common';
import { QueuesService } from './queues.service';
import { QueuesController } from './queues.controller';
import { BullQueueProvider } from './providers/bull-queue';
import { BullModule } from '@nestjs/bull';
import { QueueNames } from './base/queue-names';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailManagerModule } from 'src/components/email-manager/email-manager.module';
import { RegistrationInvitationConsumer } from './consumers';
import { AuthModule } from 'src/components/auth/auth.module';

const bullQueueRegistration: DynamicModule[] = Object.values(QueueNames).map(
  (queue) => {
    return BullModule.registerQueue({
      name: queue,
    });
  },
);

@Module({
  providers: [QueuesService, BullQueueProvider, RegistrationInvitationConsumer],
  controllers: [QueuesController],
  imports: [
    ConfigModule,
    forwardRef(() => AuthModule),
    EmailManagerModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST') ?? 'localhost',
          port: Number(configService.get('REDIS_PORT') ?? 6379),
          // password: configService.get<string>('REDIS_PWD') ?? 'admin@12345', // Showing console warning in password as it is not required for redis config
        },
      }),
    }),
    ...bullQueueRegistration,
  ],
  exports: [QueuesService],
})
export class QueuesModule {}

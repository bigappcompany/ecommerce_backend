import {
  OnQueueActive,
  OnQueueError,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { QueueNames } from '../base';
import { Job } from 'bull';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { QueuesService } from '../queues.service';
import { AuthService } from 'src/components/auth/auth.service';
// import { AnalyticsNotificationsService } from 'src/packages/analytics-notifications/analytics-notifications.service';

@Injectable()
@Processor(QueueNames.RegistrationInvitation)
export class RegistrationInvitationConsumer {
  constructor(
    @Inject(forwardRef(() => QueuesService))
    private queueService: QueuesService,
    readonly authService: AuthService,
  ) {}

  @OnQueueError()
  onError(err: any) {
    console.error(err);
  }

  @OnQueueActive()
  onActive(job: Job) {
    console.log(`Processing job - ${job.id}`, {
      data: job.data,
    });
  }

  @OnQueueFailed()
  async onProcessing(job: Job, err: Error) {
    if (err && err.message === 'job stalled more than allowable limit') {
      await job.remove().catch((err) => {
        console.error(
          `jobId: ${job.id} remove error: ${err.message}`,
          err.stack,
        );
      });
    }
    console.log(err);
  }

  @Process()
  async handleSyncEmailAttachment(job: Job<any>) {
    console.log('NEW EMAIL ATTACHMENT SYNC QUEUE JOB :::: ', {
      job: job.data,
    });

    // Perform the operation directly without context management
    await this.sendAnalyticsNotification(job.data);
  }

  async sendAnalyticsNotification(user: object) {
    console.log('Sending notification for User:', user);
    // Add your notification logic here
    this.authService.sendRegistrationInvite(user);
  }
}

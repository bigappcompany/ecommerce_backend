import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { QueueProvider } from '../base/queue.provider';
import { InjectQueue } from '@nestjs/bull';
import { QueueNames } from '../base/queue-names';
import { Queue } from 'bull';

@Injectable()
export class BullQueueProvider implements QueueProvider {
  constructor(
    @InjectQueue(QueueNames.RegistrationInvitation)
    private registrationInvitation: Queue,
  ) {}

  /**
   * This function returns the mapping for the queues with queue name enum.
   * ***** IT IS REQUIRED TO ADD NEW QUEUE HERE AS WELL IN ORDER TO WORK *****
   * @returns
   */
  private getQueueMap() {
    const queueMap = new Map<QueueNames, Queue>();
    queueMap.set(
      QueueNames.RegistrationInvitation,
      this.registrationInvitation,
    );

    return queueMap;
  }

  private getQueue(queueName: QueueNames) {
    const queueMap = this.getQueueMap();
    const queue = queueMap.get(queueName);

    if (!queue) {
      throw new HttpException('Queue not found !', HttpStatus.BAD_REQUEST);
    }
    return queue;
  }

  async pushMessage<T>(queueName: any, payload: T): Promise<void> {
    const queue = this.getQueue(queueName);
    queue.add(payload);
  }
}

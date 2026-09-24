import type { Logger } from '../../../application/ports/Logger.js';
import type { ProcessNotificationEventUseCase } from '../../../application/use-cases/ProcessNotificationEventUseCase.js';
import { InvalidEventError } from '../../../domain/errors/EventErrors.js';
import type { QueueMessage, QueueTransportPort } from './QueueTransportPort.js';

export class SqsMessageHandler {
  constructor(
    private readonly processor: ProcessNotificationEventUseCase,
    private readonly transport: QueueTransportPort,
    private readonly logger: Logger,
  ) {}

  async handle(message: QueueMessage): Promise<void> {
    try {
      if (!message.body) throw new InvalidEventError('SQS message has no body');
      if (!message.receiptHandle) throw new InvalidEventError('SQS message has no receipt handle');
      let payload: unknown;
      try {
        payload = JSON.parse(message.body) as unknown;
      } catch {
        throw new InvalidEventError('SQS message body is not valid JSON');
      }
      await this.processor.execute(payload);
      await this.transport.acknowledge(message.receiptHandle);
    } catch (error) {
      this.logger.error('MESSAGE_PROCESSING_FAILED', {
        message_id: message.messageId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

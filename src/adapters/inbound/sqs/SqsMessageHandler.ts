import type { Logger } from '../../../application/ports/Logger.js';
import type { ProcessNotificationEventUseCase } from '../../../application/use-cases/ProcessNotificationEventUseCase.js';
import { InvalidEventError } from '../../../domain/errors/EventErrors.js';
import type { QueueMessage, QueueTransportPort } from './QueueTransportPort.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Aceita payload flat ou envelope EventBridge (`detail`). */
function parseMessageBody(body: string): unknown {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body) as unknown;
  } catch {
    throw new InvalidEventError('SQS message body is not valid JSON');
  }
  if (isRecord(parsed) && 'detail' in parsed) {
    const detail = parsed.detail;
    if (!isRecord(detail)) {
      throw new InvalidEventError('EventBridge detail must be a JSON object');
    }
    return detail;
  }
  return parsed;
}

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
      const payload = parseMessageBody(message.body);
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

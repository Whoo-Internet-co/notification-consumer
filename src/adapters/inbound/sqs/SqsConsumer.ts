import type { Logger } from '../../../application/ports/Logger.js';
import type { QueueTransportPort } from './QueueTransportPort.js';
import type { SqsMessageHandler } from './SqsMessageHandler.js';

export class SqsConsumer {
  private readonly controller = new AbortController();

  constructor(
    private readonly transport: QueueTransportPort,
    private readonly handler: SqsMessageHandler,
    private readonly logger: Logger,
  ) {}

  stop(): void {
    this.controller.abort();
  }

  async start(): Promise<void> {
    this.logger.info('CONSUMER_STARTED');
    while (!this.controller.signal.aborted) {
      try {
        const messages = await this.transport.receive(this.controller.signal);
        for (const message of messages) {
          if (this.controller.signal.aborted) break;
          try {
            await this.handler.handle(message);
          } catch {
            // SQS visibility timeout and redrive policy control retries and DLQ routing.
          }
        }
      } catch (error) {
        if (!this.controller.signal.aborted) {
          this.logger.error('SQS_RECEIVE_FAILED', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
    this.logger.info('CONSUMER_STOPPED');
  }
}

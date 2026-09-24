import type { EventValidator } from '../ports/EventValidator.js';
import type { IdempotencyRepository } from '../ports/IdempotencyRepository.js';
import type { Logger } from '../ports/Logger.js';
import type { NotificationGateway } from '../ports/NotificationGateway.js';

export type ProcessingResult = 'PROCESSED' | 'DUPLICATE';

export class ProcessNotificationEventUseCase {
  constructor(
    private readonly validator: EventValidator,
    private readonly idempotency: IdempotencyRepository,
    private readonly notifications: NotificationGateway,
    private readonly logger: Logger,
  ) {}

  async execute(input: unknown): Promise<ProcessingResult> {
    const event = this.validator.validate(input);
    if (await this.idempotency.hasBeenProcessed(event.event_id)) {
      this.logger.info('DUPLICATE_EVENT', {
        event_id: event.event_id,
        correlation_id: event.correlation_id,
      });
      return 'DUPLICATE';
    }

    const notification = await this.notifications.send(event);
    await this.idempotency.markAsProcessed(event.event_id);
    this.logger.info('NOTIFICATION_SIMULATED', {
      event_id: event.event_id,
      id_autorizacao: event.id_autorizacao,
      id_contrato: event.id_contrato,
      correlation_id: event.correlation_id,
      trace_id: event.trace_id,
      notification_status: notification.status,
      notification_channel: notification.channel,
    });
    return 'PROCESSED';
  }
}

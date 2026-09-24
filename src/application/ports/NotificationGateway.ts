import type { AuthorizedTransactionEvent } from '../../domain/entities/AuthorizedTransactionEvent.js';

export interface NotificationResult {
  status: 'SIMULATED';
  channel: 'MOCK';
}

export interface NotificationGateway {
  send(event: AuthorizedTransactionEvent): Promise<NotificationResult>;
}

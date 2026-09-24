import type {
  NotificationGateway,
  NotificationResult,
} from '../../../application/ports/NotificationGateway.js';

export class MockNotificationGateway implements NotificationGateway {
  send(): Promise<NotificationResult> {
    return Promise.resolve({ status: 'SIMULATED', channel: 'MOCK' });
  }
}

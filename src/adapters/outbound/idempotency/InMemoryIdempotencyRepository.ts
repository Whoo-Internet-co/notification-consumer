import type { IdempotencyRepository } from '../../../application/ports/IdempotencyRepository.js';

export class InMemoryIdempotencyRepository implements IdempotencyRepository {
  private readonly processed = new Set<string>();

  hasBeenProcessed(eventId: string): Promise<boolean> {
    return Promise.resolve(this.processed.has(eventId));
  }

  markAsProcessed(eventId: string): Promise<void> {
    this.processed.add(eventId);
    return Promise.resolve();
  }
}

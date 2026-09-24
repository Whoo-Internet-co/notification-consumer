export interface IdempotencyRepository {
  hasBeenProcessed(eventId: string): Promise<boolean>;
  markAsProcessed(eventId: string): Promise<void>;
}

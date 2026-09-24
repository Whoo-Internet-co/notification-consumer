import type { AuthorizedTransactionEvent } from '../../domain/entities/AuthorizedTransactionEvent.js';

export interface EventValidator {
  validate(input: unknown): AuthorizedTransactionEvent;
}

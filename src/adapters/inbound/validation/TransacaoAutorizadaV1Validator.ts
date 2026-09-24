import type { EventValidator } from '../../../application/ports/EventValidator.js';
import type { AuthorizedTransactionEvent } from '../../../domain/entities/AuthorizedTransactionEvent.js';
import { InvalidEventError, UnsupportedEventError } from '../../../domain/errors/EventErrors.js';

const requiredStrings = [
  'event_id',
  'occurred_at',
  'id_autorizacao',
  'id_contrato',
  'correlation_id',
] as const;

export class TransacaoAutorizadaV1Validator implements EventValidator {
  validate(input: unknown): AuthorizedTransactionEvent {
    if (!isRecord(input)) throw new InvalidEventError('Event must be an object');
    if (input.event_type !== 'TransacaoAutorizada') {
      throw new UnsupportedEventError('Unsupported event_type');
    }
    if (input.event_version !== '1.0') {
      throw new UnsupportedEventError('Unsupported event_version');
    }
    for (const field of requiredStrings) {
      if (typeof input[field] !== 'string' || input[field].length === 0) {
        throw new InvalidEventError(`Invalid ${field}`);
      }
    }
    if (Number.isNaN(Date.parse(input.occurred_at as string))) {
      throw new InvalidEventError('Invalid occurred_at');
    }
    if (typeof input.valor !== 'number' || !Number.isFinite(input.valor)) {
      throw new InvalidEventError('Invalid valor');
    }
    if (typeof input.saldo_reservado !== 'number' || !Number.isFinite(input.saldo_reservado)) {
      throw new InvalidEventError('Invalid saldo_reservado');
    }
    if (input.trace_id !== null && typeof input.trace_id !== 'string') {
      throw new InvalidEventError('Invalid trace_id');
    }
    return input as unknown as AuthorizedTransactionEvent;
  }
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

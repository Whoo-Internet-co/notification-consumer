import type { AuthorizedTransactionEvent } from '../src/domain/entities/AuthorizedTransactionEvent.js';

export function event(
  overrides: Partial<AuthorizedTransactionEvent> = {},
): AuthorizedTransactionEvent {
  return {
    event_id: '3e513677-e10b-486a-b72f-93b01d60d6df',
    event_type: 'TransacaoAutorizada',
    event_version: '1.0',
    occurred_at: '2026-09-23T20:00:00.000Z',
    id_autorizacao: 'auth-123',
    id_contrato: 'contract-456',
    valor: 100,
    saldo_reservado: 900,
    correlation_id: 'correlation-789',
    trace_id: null,
    ...overrides,
  };
}

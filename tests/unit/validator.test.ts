import { describe, expect, it } from 'vitest';
import { TransacaoAutorizadaV1Validator } from '../../src/adapters/inbound/validation/TransacaoAutorizadaV1Validator.js';
import { InvalidEventError, UnsupportedEventError } from '../../src/domain/errors/EventErrors.js';
import { event } from '../fixtures.js';

describe('TransacaoAutorizadaV1Validator', () => {
  const validator = new TransacaoAutorizadaV1Validator();

  it('accepts the minimum contract', () => expect(validator.validate(event())).toEqual(event()));

  it('accepts backward-compatible MINOR evolutions of event_version', () => {
    const evolved = event({ event_version: '1.7' });
    expect(validator.validate(evolved)).toEqual(evolved);
  });

  it('tolerates additional properties from newer contract revisions', () => {
    const withExtra = { ...event(), novo_campo_opcional: 'abc' };
    expect(validator.validate(withExtra)).toEqual(withExtra);
  });

  it.each([
    null,
    [],
    { ...event(), event_id: '' },
    { ...event(), event_id: 'not-a-uuid' },
    { ...event(), occurred_at: 'invalid' },
    { ...event(), occurred_at: '2026-09-23T20:00:00.000' },
    { ...event(), valor: Number.NaN },
    { ...event(), valor: 0 },
    { ...event(), saldo_reservado: '900' },
    { ...event(), trace_id: 123 },
  ])('rejects input that violates the official schema %#', (input) => {
    expect(() => validator.validate(input)).toThrow(InvalidEventError);
  });

  it.each([
    { ...event(), event_type: 'OutroEvento' },
    { ...event(), event_version: '2.0' },
    { ...event(), event_version: '1.0.1' },
  ])('rejects unsupported contracts %#', (input) => {
    expect(() => validator.validate(input)).toThrow(UnsupportedEventError);
  });
});

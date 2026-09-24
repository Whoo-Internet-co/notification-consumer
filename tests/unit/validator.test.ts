import { describe, expect, it } from 'vitest';
import { TransacaoAutorizadaV1Validator } from '../../src/adapters/inbound/validation/TransacaoAutorizadaV1Validator.js';
import { InvalidEventError, UnsupportedEventError } from '../../src/domain/errors/EventErrors.js';
import { event } from '../fixtures.js';

describe('TransacaoAutorizadaV1Validator', () => {
  const validator = new TransacaoAutorizadaV1Validator();

  it('accepts the minimum contract', () => expect(validator.validate(event())).toEqual(event()));

  it.each([
    null,
    [],
    { ...event(), event_id: '' },
    { ...event(), occurred_at: 'invalid' },
    { ...event(), valor: Number.NaN },
    { ...event(), saldo_reservado: '900' },
    { ...event(), trace_id: 123 },
  ])('rejects invalid input %#', (input) => {
    expect(() => validator.validate(input)).toThrow(InvalidEventError);
  });

  it.each([
    { ...event(), event_type: 'OutroEvento' },
    { ...event(), event_version: '2.0' },
  ])('rejects unsupported contracts %#', (input) => {
    expect(() => validator.validate(input)).toThrow(UnsupportedEventError);
  });
});

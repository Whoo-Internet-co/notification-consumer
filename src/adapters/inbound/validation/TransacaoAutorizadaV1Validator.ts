import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Ajv2020 } from 'ajv/dist/2020.js';
import type { ErrorObject, ValidateFunction } from 'ajv';
import type { FormatsPlugin } from 'ajv-formats';
import type { EventValidator } from '../../../application/ports/EventValidator.js';
import type { AuthorizedTransactionEvent } from '../../../domain/entities/AuthorizedTransactionEvent.js';
import { InvalidEventError, UnsupportedEventError } from '../../../domain/errors/EventErrors.js';

const nodeRequire = createRequire(import.meta.url);

/**
 * Subpath export do package oficial `@whoo-internet-co/finance-platform-contracts`
 * (ADR-008 — source of truth). `require.resolve` respeita o mapa de `exports`.
 */
const SCHEMA_EXPORT =
  '@whoo-internet-co/finance-platform-contracts/events/transacao-autorizada/v1/schema';

/** Plugin CJS do ajv-formats, carregado com a assinatura callable original. */
const addFormats = nodeRequire('ajv-formats') as FormatsPlugin;

function loadOfficialSchema(): Record<string, unknown> {
  const schemaPath = nodeRequire.resolve(SCHEMA_EXPORT);
  return JSON.parse(readFileSync(schemaPath, 'utf8')) as Record<string, unknown>;
}

/**
 * Valida `TransacaoAutorizada` v1 contra o JSON Schema oficial (draft 2020-12)
 * distribuído pelo package de contratos, usando Ajv + ajv-formats
 * (`event_id` uuid, `occurred_at` date-time com sufixo Z, `valor > 0`,
 * `event_version` `^1\.\d+$` — evoluções MINOR são aceitas — e
 * additionalProperties toleradas).
 */
export class TransacaoAutorizadaV1Validator implements EventValidator {
  private readonly validateFn: ValidateFunction;

  constructor() {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);
    this.validateFn = ajv.compile(loadOfficialSchema());
  }

  validate(input: unknown): AuthorizedTransactionEvent {
    if (!this.validateFn(input)) {
      throw toEventError(this.validateFn.errors ?? []);
    }
    return input as AuthorizedTransactionEvent;
  }
}

function toEventError(errors: ErrorObject[]): Error {
  const unsupported = errors.find(
    (error) => error.instancePath === '/event_type' || error.instancePath === '/event_version',
  );
  if (unsupported !== undefined) {
    return new UnsupportedEventError(`Unsupported ${unsupported.instancePath.slice(1)}`);
  }
  return new InvalidEventError(
    errors
      .map(
        (error) =>
          `${error.instancePath === '' ? '/' : error.instancePath} ${error.message ?? 'is invalid'}`,
      )
      .join('; '),
  );
}

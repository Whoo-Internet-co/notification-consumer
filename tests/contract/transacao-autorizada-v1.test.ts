import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TransacaoAutorizadaV1Validator } from '../../src/adapters/inbound/validation/TransacaoAutorizadaV1Validator.js';
import { InvalidEventError, UnsupportedEventError } from '../../src/domain/errors/EventErrors.js';

/**
 * Consumer contract testing (ADR-008): o consumidor DEVE ser compatível com o
 * contrato oficial distribuído por `@whoo-internet-co/finance-platform-contracts`.
 *
 * - O exemplo VÁLIDO oficial é carregado diretamente do package (subpath export
 *   `./events/transacao-autorizada/v1/example`) e deve passar.
 * - Os exemplos INVÁLIDOS oficiais são cópias verbatim de
 *   `finance-platform-contracts@1.0.1:events/transacao-autorizada/v1/invalid-examples/`
 *   (o tarball publicado não distribui essa pasta — ver `files` no package.json
 *   do package) e devem falhar.
 */

const nodeRequire = createRequire(import.meta.url);

const EXAMPLE_EXPORT =
  '@whoo-internet-co/finance-platform-contracts/events/transacao-autorizada/v1/example';

function officialExample(): unknown {
  return JSON.parse(readFileSync(nodeRequire.resolve(EXAMPLE_EXPORT), 'utf8')) as unknown;
}

function officialInvalidExample(
  name: 'invalid-event-type' | 'invalid-version' | 'missing-event-id',
): unknown {
  const path = fileURLToPath(new URL(`./invalid-examples/${name}.json`, import.meta.url));
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

describe('TransacaoAutorizada v1 consumer contract (ADR-008)', () => {
  const validator = new TransacaoAutorizadaV1Validator();

  it('accepts the official example shipped by the contracts package', () => {
    const example = officialExample();
    expect(validator.validate(example)).toEqual(example);
  });

  it.each([
    ['invalid-event-type', UnsupportedEventError],
    ['invalid-version', UnsupportedEventError],
    ['missing-event-id', InvalidEventError],
  ] as const)('rejects the official invalid example %s', (name, expectedError) => {
    expect(() => validator.validate(officialInvalidExample(name))).toThrow(expectedError);
  });
});

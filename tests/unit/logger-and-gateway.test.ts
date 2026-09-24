import { afterEach, describe, expect, it, vi } from 'vitest';
import { JsonConsoleLogger } from '../../src/adapters/outbound/logging/JsonConsoleLogger.js';
import { MockNotificationGateway } from '../../src/adapters/outbound/notification/MockNotificationGateway.js';
import { event } from '../fixtures.js';

describe('outbound adapters', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns a deterministic notification result', async () => {
    await expect(new MockNotificationGateway().send(event())).resolves.toEqual({
      status: 'SIMULATED',
      channel: 'MOCK',
    });
  });

  it('writes structured JSON logs', () => {
    const output = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const logger = new JsonConsoleLogger();
    logger.info('ok', { event_id: '1' });
    logger.error('failed');
    expect(JSON.parse(String(output.mock.calls[0]?.[0]))).toEqual({
      level: 'info',
      message: 'ok',
      event_id: '1',
    });
    expect(JSON.parse(String(errors.mock.calls[0]?.[0]))).toEqual({
      level: 'error',
      message: 'failed',
    });
  });
});

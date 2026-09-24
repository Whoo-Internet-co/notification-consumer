import { describe, expect, it, vi } from 'vitest';
import { InMemoryIdempotencyRepository } from '../../src/adapters/outbound/idempotency/InMemoryIdempotencyRepository.js';
import { TransacaoAutorizadaV1Validator } from '../../src/adapters/inbound/validation/TransacaoAutorizadaV1Validator.js';
import type { Logger } from '../../src/application/ports/Logger.js';
import type { NotificationGateway } from '../../src/application/ports/NotificationGateway.js';
import { ProcessNotificationEventUseCase } from '../../src/application/use-cases/ProcessNotificationEventUseCase.js';
import { event } from '../fixtures.js';

function setup() {
  const send = vi.fn<NotificationGateway['send']>().mockResolvedValue({
    status: 'SIMULATED',
    channel: 'MOCK',
  });
  const logger: Logger = { info: vi.fn(), error: vi.fn() };
  const idempotency = new InMemoryIdempotencyRepository();
  return {
    send,
    logger,
    idempotency,
    useCase: new ProcessNotificationEventUseCase(
      new TransacaoAutorizadaV1Validator(),
      idempotency,
      { send },
      logger,
    ),
  };
}

describe('ProcessNotificationEventUseCase', () => {
  it('sends and marks a new event as processed', async () => {
    const { useCase, send, idempotency, logger } = setup();
    await expect(useCase.execute(event())).resolves.toBe('PROCESSED');
    expect(send).toHaveBeenCalledOnce();
    await expect(idempotency.hasBeenProcessed(event().event_id)).resolves.toBe(true);
    expect(logger.info).toHaveBeenCalledWith(
      'NOTIFICATION_SIMULATED',
      expect.objectContaining({ correlation_id: event().correlation_id }),
    );
  });

  it('does not notify a duplicate event twice', async () => {
    const { useCase, send, logger } = setup();
    await useCase.execute(event());
    await expect(useCase.execute(event())).resolves.toBe('DUPLICATE');
    expect(send).toHaveBeenCalledOnce();
    expect(logger.info).toHaveBeenLastCalledWith('DUPLICATE_EVENT', expect.any(Object));
  });

  it('does not mark an event when notification fails', async () => {
    const { useCase, send, idempotency } = setup();
    send.mockRejectedValueOnce(new Error('provider unavailable'));
    await expect(useCase.execute(event())).rejects.toThrow('provider unavailable');
    await expect(idempotency.hasBeenProcessed(event().event_id)).resolves.toBe(false);
  });
});

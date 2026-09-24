import { describe, expect, it, vi } from 'vitest';
import { SqsMessageHandler } from '../../src/adapters/inbound/sqs/SqsMessageHandler.js';
import { TransacaoAutorizadaV1Validator } from '../../src/adapters/inbound/validation/TransacaoAutorizadaV1Validator.js';
import { InMemoryIdempotencyRepository } from '../../src/adapters/outbound/idempotency/InMemoryIdempotencyRepository.js';
import type { QueueTransportPort } from '../../src/adapters/inbound/sqs/QueueTransportPort.js';
import type { Logger } from '../../src/application/ports/Logger.js';
import { ProcessNotificationEventUseCase } from '../../src/application/use-cases/ProcessNotificationEventUseCase.js';
import { event } from '../fixtures.js';

function setup(send = vi.fn().mockResolvedValue({ status: 'SIMULATED', channel: 'MOCK' })) {
  const transport: QueueTransportPort = { receive: vi.fn(), acknowledge: vi.fn() };
  const logger: Logger = { info: vi.fn(), error: vi.fn() };
  const processor = new ProcessNotificationEventUseCase(
    new TransacaoAutorizadaV1Validator(),
    new InMemoryIdempotencyRepository(),
    { send },
    logger,
  );
  return { handler: new SqsMessageHandler(processor, transport, logger), transport, logger };
}

describe('SqsMessageHandler', () => {
  it('acknowledges only after successful processing', async () => {
    const { handler, transport } = setup();
    await handler.handle({
      body: JSON.stringify(event()),
      receiptHandle: 'receipt',
      messageId: '1',
    });
    expect(transport.acknowledge).toHaveBeenCalledWith('receipt');
  });

  it.each([
    { body: undefined, receiptHandle: 'receipt' },
    { body: '{}', receiptHandle: undefined },
    { body: '{invalid', receiptHandle: 'receipt' },
    { body: '{}', receiptHandle: 'receipt' },
  ])('does not acknowledge invalid messages %#', async (message) => {
    const { handler, transport, logger } = setup();
    await expect(handler.handle(message)).rejects.toThrow();
    expect(transport.acknowledge).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('MESSAGE_PROCESSING_FAILED', expect.any(Object));
  });

  it('does not acknowledge when notification fails', async () => {
    const { handler, transport } = setup(vi.fn().mockRejectedValue(new Error('failed')));
    await expect(
      handler.handle({ body: JSON.stringify(event()), receiptHandle: 'receipt' }),
    ).rejects.toThrow('failed');
    expect(transport.acknowledge).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { QueueTransportPort } from '../../src/adapters/inbound/sqs/QueueTransportPort.js';
import { SqsConsumer } from '../../src/adapters/inbound/sqs/SqsConsumer.js';
import type { SqsMessageHandler } from '../../src/adapters/inbound/sqs/SqsMessageHandler.js';
import type { Logger } from '../../src/application/ports/Logger.js';

function logger(): Logger {
  return { info: vi.fn(), error: vi.fn() };
}

describe('SqsConsumer', () => {
  it('stops before polling when already aborted', async () => {
    const transport: QueueTransportPort = { receive: vi.fn(), acknowledge: vi.fn() };
    const log = logger();
    const consumer = new SqsConsumer(
      transport,
      { handle: vi.fn() } as unknown as SqsMessageHandler,
      log,
    );
    consumer.stop();
    await consumer.start();
    expect(transport.receive).not.toHaveBeenCalled();
    expect(log.info).toHaveBeenCalledWith('CONSUMER_STOPPED');
  });

  it('processes received messages and stops gracefully', async () => {
    const transport: QueueTransportPort = {
      receive: vi.fn().mockResolvedValue([{ body: '{}', receiptHandle: 'receipt' }]),
      acknowledge: vi.fn(),
    };
    const log = logger();
    let consumer: SqsConsumer;
    const handler = {
      handle: vi.fn().mockImplementation(async () => {
        consumer.stop();
      }),
    } as unknown as SqsMessageHandler;
    consumer = new SqsConsumer(transport, handler, log);
    await consumer.start();
    expect(handler.handle).toHaveBeenCalledOnce();
    expect(log.info).toHaveBeenNthCalledWith(1, 'CONSUMER_STARTED');
  });

  it('logs receive failures and continues until stopped', async () => {
    const log = logger();
    let consumer: SqsConsumer;
    const receive = vi.fn().mockImplementation(async () => {
      consumer.stop();
      throw new Error('network');
    });
    consumer = new SqsConsumer(
      { receive, acknowledge: vi.fn() },
      { handle: vi.fn() } as unknown as SqsMessageHandler,
      log,
    );
    await consumer.start();
    expect(log.error).not.toHaveBeenCalled();
  });

  it('swallows message failures so SQS can redeliver', async () => {
    const log = logger();
    let consumer: SqsConsumer;
    const transport: QueueTransportPort = {
      receive: vi.fn().mockResolvedValue([{ body: '{}', receiptHandle: 'receipt' }]),
      acknowledge: vi.fn(),
    };
    const handler = {
      handle: vi.fn().mockImplementation(async () => {
        consumer.stop();
        throw new Error('processing failed');
      }),
    } as unknown as SqsMessageHandler;
    consumer = new SqsConsumer(transport, handler, log);
    await expect(consumer.start()).resolves.toBeUndefined();
  });
});

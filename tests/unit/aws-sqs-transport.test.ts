import { DeleteMessageCommand, ReceiveMessageCommand, type SQSClient } from '@aws-sdk/client-sqs';
import { describe, expect, it, vi } from 'vitest';
import { AwsSqsTransport } from '../../src/infrastructure/aws/AwsSqsTransport.js';

const config = {
  region: 'sa-east-1',
  queueUrl: 'https://example.test/queue',
  waitTimeSeconds: 20,
  visibilityTimeout: 30,
  maxNumberOfMessages: 10,
};

describe('AwsSqsTransport', () => {
  it('uses long polling and maps messages', async () => {
    const send = vi.fn().mockResolvedValue({
      Messages: [{ MessageId: 'id', ReceiptHandle: 'receipt', Body: '{}' }, {}],
    });
    const transport = new AwsSqsTransport(config, { send } as unknown as SQSClient);
    await expect(transport.receive()).resolves.toEqual([
      { messageId: 'id', receiptHandle: 'receipt', body: '{}' },
      {},
    ]);
    const command = send.mock.calls[0]?.[0];
    expect(command).toBeInstanceOf(ReceiveMessageCommand);
    expect(command.input).toEqual({
      QueueUrl: config.queueUrl,
      WaitTimeSeconds: 20,
      VisibilityTimeout: 30,
      MaxNumberOfMessages: 10,
    });
  });

  it('returns an empty list when SQS has no messages', async () => {
    const send = vi.fn().mockResolvedValue({});
    const transport = new AwsSqsTransport(config, { send } as unknown as SQSClient);
    await expect(transport.receive()).resolves.toEqual([]);
  });

  it('deletes a message by receipt handle', async () => {
    const send = vi.fn().mockResolvedValue({});
    const transport = new AwsSqsTransport(config, { send } as unknown as SQSClient);
    await transport.acknowledge('receipt');
    const command = send.mock.calls[0]?.[0];
    expect(command).toBeInstanceOf(DeleteMessageCommand);
    expect(command.input).toEqual({ QueueUrl: config.queueUrl, ReceiptHandle: 'receipt' });
  });
});

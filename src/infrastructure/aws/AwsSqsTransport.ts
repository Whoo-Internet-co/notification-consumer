import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
  type Message,
} from '@aws-sdk/client-sqs';
import type {
  QueueMessage,
  QueueTransportPort,
} from '../../adapters/inbound/sqs/QueueTransportPort.js';

export interface SqsTransportConfig {
  region: string;
  queueUrl: string;
  waitTimeSeconds: number;
  visibilityTimeout: number;
  maxNumberOfMessages: number;
}

export class AwsSqsTransport implements QueueTransportPort {
  private readonly client: SQSClient;

  constructor(
    private readonly config: SqsTransportConfig,
    client?: SQSClient,
  ) {
    this.client = client ?? new SQSClient({ region: config.region });
  }

  async receive(signal?: AbortSignal): Promise<QueueMessage[]> {
    const result = await this.client.send(
      new ReceiveMessageCommand({
        QueueUrl: this.config.queueUrl,
        WaitTimeSeconds: this.config.waitTimeSeconds,
        VisibilityTimeout: this.config.visibilityTimeout,
        MaxNumberOfMessages: this.config.maxNumberOfMessages,
      }),
      { abortSignal: signal },
    );
    return (result.Messages ?? []).map(mapMessage);
  }

  async acknowledge(receiptHandle: string): Promise<void> {
    await this.client.send(
      new DeleteMessageCommand({ QueueUrl: this.config.queueUrl, ReceiptHandle: receiptHandle }),
    );
  }
}

function mapMessage(message: Message): QueueMessage {
  return {
    ...(message.MessageId === undefined ? {} : { messageId: message.MessageId }),
    ...(message.ReceiptHandle === undefined ? {} : { receiptHandle: message.ReceiptHandle }),
    ...(message.Body === undefined ? {} : { body: message.Body }),
  };
}

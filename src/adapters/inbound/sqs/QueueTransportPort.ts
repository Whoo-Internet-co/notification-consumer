export interface QueueMessage {
  messageId?: string;
  receiptHandle?: string;
  body?: string;
}

export interface QueueTransportPort {
  receive(signal?: AbortSignal): Promise<QueueMessage[]>;
  acknowledge(receiptHandle: string): Promise<void>;
}

import { SqsConsumer } from './adapters/inbound/sqs/SqsConsumer.js';
import { SqsMessageHandler } from './adapters/inbound/sqs/SqsMessageHandler.js';
import { TransacaoAutorizadaV1Validator } from './adapters/inbound/validation/TransacaoAutorizadaV1Validator.js';
import { InMemoryIdempotencyRepository } from './adapters/outbound/idempotency/InMemoryIdempotencyRepository.js';
import { JsonConsoleLogger } from './adapters/outbound/logging/JsonConsoleLogger.js';
import { MockNotificationGateway } from './adapters/outbound/notification/MockNotificationGateway.js';
import { ProcessNotificationEventUseCase } from './application/use-cases/ProcessNotificationEventUseCase.js';
import { AwsSqsTransport } from './infrastructure/aws/AwsSqsTransport.js';
import { loadConfig } from './infrastructure/config/Config.js';

const logger = new JsonConsoleLogger();
const transport = new AwsSqsTransport(loadConfig());
const processor = new ProcessNotificationEventUseCase(
  new TransacaoAutorizadaV1Validator(),
  new InMemoryIdempotencyRepository(),
  new MockNotificationGateway(),
  logger,
);
const consumer = new SqsConsumer(
  transport,
  new SqsMessageHandler(processor, transport, logger),
  logger,
);

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    logger.info('SHUTDOWN_REQUESTED', { signal });
    consumer.stop();
  });
}

await consumer.start();

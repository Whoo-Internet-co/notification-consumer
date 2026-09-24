import type { SqsTransportConfig } from '../aws/AwsSqsTransport.js';

export function loadConfig(env: NodeJS.ProcessEnv = process.env): SqsTransportConfig {
  const queueUrl = env.SQS_QUEUE_URL;
  if (!queueUrl) throw new Error('SQS_QUEUE_URL is required');
  return {
    region: env.AWS_REGION ?? 'us-east-1',
    queueUrl,
    waitTimeSeconds: integer(env.SQS_WAIT_TIME_SECONDS, 20, 0, 20),
    visibilityTimeout: integer(env.SQS_VISIBILITY_TIMEOUT, 30, 0, 43_200),
    maxNumberOfMessages: integer(env.SQS_MAX_NUMBER_OF_MESSAGES, 10, 1, 10),
  };
}

function integer(value: string | undefined, fallback: number, min: number, max: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`Invalid integer configuration: ${value}`);
  }
  return parsed;
}

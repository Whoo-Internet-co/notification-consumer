import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/infrastructure/config/Config.js';

describe('loadConfig', () => {
  it('loads defaults', () => {
    expect(loadConfig({ SQS_QUEUE_URL: 'queue' })).toEqual({
      region: 'us-east-1',
      queueUrl: 'queue',
      waitTimeSeconds: 20,
      visibilityTimeout: 30,
      maxNumberOfMessages: 10,
    });
  });

  it('loads overrides', () => {
    expect(
      loadConfig({
        SQS_QUEUE_URL: 'queue',
        AWS_REGION: 'sa-east-1',
        SQS_WAIT_TIME_SECONDS: '10',
        SQS_VISIBILITY_TIMEOUT: '60',
        SQS_MAX_NUMBER_OF_MESSAGES: '5',
      }),
    ).toEqual(expect.objectContaining({ region: 'sa-east-1', waitTimeSeconds: 10 }));
  });

  it('requires a queue URL', () => expect(() => loadConfig({})).toThrow('SQS_QUEUE_URL'));
  it('rejects invalid numbers', () =>
    expect(() => loadConfig({ SQS_QUEUE_URL: 'queue', SQS_MAX_NUMBER_OF_MESSAGES: '11' })).toThrow(
      'Invalid integer',
    ));
});

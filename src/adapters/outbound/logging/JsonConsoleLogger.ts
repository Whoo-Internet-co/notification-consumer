import type { Logger } from '../../../application/ports/Logger.js';

export class JsonConsoleLogger implements Logger {
  info(message: string, context: Record<string, unknown> = {}): void {
    console.log(JSON.stringify({ level: 'info', message, ...context }));
  }

  error(message: string, context: Record<string, unknown> = {}): void {
    console.error(JSON.stringify({ level: 'error', message, ...context }));
  }
}

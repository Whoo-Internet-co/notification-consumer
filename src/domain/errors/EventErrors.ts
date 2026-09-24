export class InvalidEventError extends Error {
  override readonly name = 'InvalidEventError';
}

export class UnsupportedEventError extends Error {
  override readonly name = 'UnsupportedEventError';
}

export const errorCodes = [
  'invalidSecret', 'invalidSecretBits', 'missingName', 'nameTooLong', 'unsupportedAlgorithm',
  'unsupportedDigits', 'invalidPeriod', 'invalidUri', 'unsupportedUri', 'invalidLabel',
  'issuerMismatch', 'cryptoUnavailable', 'imageRequired', 'imageTooLarge', 'imageUnreadable',
  'canvasUnavailable', 'qrNotFound', 'unexpected',
] as const
export type ErrorCode = typeof errorCodes[number]

export class AppError extends Error {
  code: ErrorCode
  constructor(code: ErrorCode) {
    super(code)
    this.name = 'AppError'
    this.code = code
  }
}

export function getErrorCode(cause: unknown): ErrorCode {
  return cause instanceof AppError ? cause.code : 'unexpected'
}

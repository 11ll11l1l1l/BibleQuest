import type { AppFailure } from './async-state.ts';

export class SafeAppError extends Error {
  readonly failure: AppFailure;

  constructor(failure: AppFailure) {
    super(failure.message);
    this.name = 'SafeAppError';
    this.failure = Object.freeze({ ...failure });
  }
}

const FAILURE_BY_STATUS: Readonly<Record<number, AppFailure>> = Object.freeze({
  401: Object.freeze({ kind: 'unauthorized', message: 'Sign in again to continue.', retryable: false }),
  403: Object.freeze({ kind: 'forbidden', message: 'You do not have access to this action.', retryable: false }),
  404: Object.freeze({ kind: 'not_found', message: 'The requested item is no longer available.', retryable: false }),
  409: Object.freeze({ kind: 'conflict', message: 'This item changed. Refresh and try again.', retryable: true }),
  422: Object.freeze({ kind: 'validation', message: 'Check the information and try again.', retryable: false }),
  429: Object.freeze({ kind: 'remote', message: 'Too many requests. Try again shortly.', retryable: true }),
  500: Object.freeze({ kind: 'remote', message: 'The service could not complete the request.', retryable: true }),
  502: Object.freeze({ kind: 'remote', message: 'The service is temporarily unavailable.', retryable: true }),
  503: Object.freeze({ kind: 'remote', message: 'The service is temporarily unavailable.', retryable: true }),
  504: Object.freeze({ kind: 'remote', message: 'The service took too long to respond.', retryable: true }),
});

function statusFrom(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const candidate = error as { status?: unknown; statusCode?: unknown };
  const raw = candidate.status ?? candidate.statusCode;
  const status = Number(raw);
  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : null;
}

export function toSafeFailure(error: unknown): AppFailure {
  if (error instanceof SafeAppError) return error.failure;
  if (error && typeof error === 'object' && (error as { name?: unknown }).name === 'AbortError') {
    return Object.freeze({ kind: 'cancelled', message: 'Request cancelled.', retryable: false });
  }

  const status = statusFrom(error);
  if (status && FAILURE_BY_STATUS[status]) return FAILURE_BY_STATUS[status];
  if (status && status >= 500) {
    return Object.freeze({ kind: 'remote', message: 'The service could not complete the request.', retryable: true });
  }

  return Object.freeze({
    kind: 'unknown',
    message: 'Something went wrong. Try again.',
    retryable: true,
  });
}

export function appFailure(
  kind: AppFailure['kind'],
  message: string,
  retryable = false,
): AppFailure {
  const safeMessage = String(message ?? '').trim();
  if (!safeMessage) throw new Error('Safe user-facing failure message is required.');
  return Object.freeze({ kind, message: safeMessage, retryable: Boolean(retryable) });
}

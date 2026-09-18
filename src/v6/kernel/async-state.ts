export type AsyncStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface AppFailure {
  readonly kind:
    | 'offline'
    | 'unauthorized'
    | 'forbidden'
    | 'not_found'
    | 'conflict'
    | 'validation'
    | 'cancelled'
    | 'remote'
    | 'unknown';
  readonly message: string;
  readonly retryable: boolean;
}

export type AsyncState<T> =
  | Readonly<{ status: 'idle'; data: T | null; failure: null; requestId: number }>
  | Readonly<{ status: 'loading'; data: T | null; failure: null; requestId: number }>
  | Readonly<{ status: 'ready'; data: T; failure: null; requestId: number }>
  | Readonly<{ status: 'error'; data: T | null; failure: AppFailure; requestId: number }>;

export function idleAsync<T>(data: T | null = null): AsyncState<T> {
  return Object.freeze({ status: 'idle', data, failure: null, requestId: 0 });
}

export function beginAsync<T>(state: AsyncState<T>, requestId: number): AsyncState<T> {
  if (!Number.isSafeInteger(requestId) || requestId <= 0) throw new Error('Positive request id required.');
  return Object.freeze({ status: 'loading', data: state.data, failure: null, requestId });
}

export function resolveAsync<T>(state: AsyncState<T>, requestId: number, data: T): AsyncState<T> {
  if (state.status !== 'loading' || state.requestId !== requestId) return state;
  return Object.freeze({ status: 'ready', data, failure: null, requestId });
}

export function rejectAsync<T>(
  state: AsyncState<T>,
  requestId: number,
  failure: AppFailure,
): AsyncState<T> {
  if (state.status !== 'loading' || state.requestId !== requestId) return state;
  return Object.freeze({ status: 'error', data: state.data, failure: Object.freeze({ ...failure }), requestId });
}

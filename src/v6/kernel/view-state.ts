import type { AppFailure, AsyncState } from './async-state.ts';

export type ViewStateKind =
  | 'idle'
  | 'loading'
  | 'content'
  | 'empty'
  | 'offline'
  | 'unauthorized'
  | 'forbidden'
  | 'error';

export interface ViewState<T> {
  readonly kind: ViewStateKind;
  readonly data: T | null;
  readonly failure: AppFailure | null;
  readonly canRetry: boolean;
}

export interface ViewStateOptions<T> {
  readonly isEmpty?: (data: T) => boolean;
}

function failureKind(failure: AppFailure): ViewStateKind {
  if (failure.kind === 'offline') return 'offline';
  if (failure.kind === 'unauthorized') return 'unauthorized';
  if (failure.kind === 'forbidden') return 'forbidden';
  return 'error';
}

function freezeView<T>(kind: ViewStateKind, data: T | null, failure: AppFailure | null): ViewState<T> {
  return Object.freeze({ kind, data, failure, canRetry: Boolean(failure?.retryable) });
}

/**
 * Maps kernel async state into the small, shared presentation contract used by
 * migrated V6 features. Views remain responsible for localized copy and
 * rendering; this contract only decides state semantics.
 */
export function toViewState<T>(state: AsyncState<T>, options: ViewStateOptions<T> = {}): ViewState<T> {
  if (state.status === 'idle') return freezeView('idle', state.data, null);
  if (state.status === 'loading') return freezeView('loading', state.data, null);
  if (state.status === 'error') return freezeView(failureKind(state.failure), state.data, state.failure);

  const empty = options.isEmpty?.(state.data) ?? false;
  return freezeView(empty ? 'empty' : 'content', state.data, null);
}

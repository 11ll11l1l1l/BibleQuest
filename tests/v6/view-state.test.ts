import assert from 'node:assert/strict';
import test from 'node:test';

import { beginAsync, idleAsync, rejectAsync, resolveAsync } from '../../src/v6/kernel/async-state.ts';
import { appFailure } from '../../src/v6/kernel/errors.ts';
import { toViewState } from '../../src/v6/kernel/view-state.ts';

test('view state distinguishes idle, loading, content and empty without inventing copy', () => {
  let state = idleAsync<string[]>();
  assert.equal(toViewState(state).kind, 'idle');

  state = beginAsync(state, 1);
  assert.equal(toViewState(state).kind, 'loading');

  state = resolveAsync(state, 1, []);
  const empty = toViewState(state, { isEmpty: (items) => items.length === 0 });
  assert.equal(empty.kind, 'empty');
  assert.equal(empty.canRetry, false);

  state = beginAsync(state, 2);
  state = resolveAsync(state, 2, ['assignment-a']);
  assert.equal(toViewState(state, { isEmpty: (items) => items.length === 0 }).kind, 'content');
});

test('view state exposes offline retryability without losing stale data', () => {
  let state = resolveAsync(beginAsync(idleAsync(['cached']), 1), 1, ['cached']);
  state = beginAsync(state, 2);
  state = rejectAsync(state, 2, appFailure('offline', 'Reconnect and try again.', true));

  const view = toViewState(state);
  assert.equal(view.kind, 'offline');
  assert.equal(view.canRetry, true);
  assert.deepEqual(view.data, ['cached']);
});

test('view state keeps authorization failures distinct and non-retryable by default', () => {
  let unauthorized = beginAsync(idleAsync<null>(), 1);
  unauthorized = rejectAsync(unauthorized, 1, appFailure('unauthorized', 'Sign in again to continue.'));
  assert.deepEqual(
    { kind: toViewState(unauthorized).kind, retry: toViewState(unauthorized).canRetry },
    { kind: 'unauthorized', retry: false },
  );

  let forbidden = beginAsync(idleAsync<null>(), 2);
  forbidden = rejectAsync(forbidden, 2, appFailure('forbidden', 'You do not have access to this action.'));
  assert.equal(toViewState(forbidden).kind, 'forbidden');
});

test('generic failures preserve the kernel retry contract', () => {
  let state = beginAsync(idleAsync<string>(), 1);
  state = rejectAsync(state, 1, appFailure('remote', 'Service unavailable.', true));
  const view = toViewState(state);
  assert.equal(view.kind, 'error');
  assert.equal(view.canRetry, true);
});

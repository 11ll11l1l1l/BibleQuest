import assert from 'node:assert/strict';
import test from 'node:test';

import { beginAsync, idleAsync, rejectAsync, resolveAsync } from '../../src/v6/kernel/async-state.ts';
import { SafeAppError, appFailure, toSafeFailure } from '../../src/v6/kernel/errors.ts';
import { createRequestCoordinator } from '../../src/v6/kernel/request-coordinator.ts';
import { createTenantContextStore, TenantContextError } from '../../src/v6/kernel/tenant-context.ts';

const member = (congregationId: string, userId = 'user-a', role: 'member' | 'leader' = 'member') =>
  Object.freeze({ congregationId, userId, role });

test('tenant context preserves V5 first-membership fallback and valid active selection', () => {
  const tenant = createTenantContextStore();
  tenant.reconcile('user-a', [member('cong-a'), member('cong-b', 'user-a', 'leader')]);
  assert.equal(tenant.scope().congregationId, 'cong-a');

  tenant.setActive('cong-b');
  const before = tenant.scope();
  tenant.reconcile('user-a', [member('cong-a'), member('cong-b', 'user-a', 'leader')]);
  assert.equal(tenant.scope().congregationId, 'cong-b');
  assert.equal(tenant.scope().generation, before.generation);
});

test('tenant context falls back when active membership disappears and rejects stale request scopes', () => {
  const tenant = createTenantContextStore();
  tenant.reconcile('user-a', [member('cong-a'), member('cong-b')]);
  tenant.setActive('cong-b');
  const stale = tenant.scope();

  tenant.reconcile('user-a', [member('cong-a')]);
  assert.equal(tenant.scope().congregationId, 'cong-a');
  assert.throws(() => tenant.assertCurrent(stale), (error) => {
    return error instanceof TenantContextError && error.code === 'BQ_TENANT_CONTEXT_STALE';
  });
});

test('account switch cannot inherit active congregation context', () => {
  const tenant = createTenantContextStore();
  tenant.reconcile('user-a', [member('cong-a'), member('cong-b')]);
  tenant.setActive('cong-b');
  const oldScope = tenant.scope();

  tenant.reconcile('user-b', [member('cong-c', 'user-b')]);
  assert.equal(tenant.scope().congregationId, 'cong-c');
  assert.throws(() => tenant.assertCurrent(oldScope));
  assert.throws(() => tenant.setActive('cong-b'), (error) => {
    return error instanceof TenantContextError && error.code === 'BQ_TENANT_MEMBERSHIP_REQUIRED';
  });
});

test('request coordinator aborts superseded work and blocks stale commits', () => {
  const requests = createRequestCoordinator();
  const first = requests.begin('home');
  const second = requests.begin('home');
  let committed = '';

  assert.equal(first.signal.aborted, true);
  assert.equal(first.commit(() => { committed = 'first'; }), false);
  assert.equal(second.commit(() => { committed = 'second'; }), true);
  assert.equal(committed, 'second');
  second.finish();
  assert.deepEqual(requests.activeKeys(), []);
});

test('request coordinator isolates unrelated request keys', () => {
  const requests = createRequestCoordinator();
  const reader = requests.begin('reader');
  const assignments = requests.begin('assignments');
  assert.equal(reader.signal.aborted, false);
  assert.equal(assignments.signal.aborted, false);
  requests.cancelAll();
  assert.equal(reader.signal.aborted, true);
  assert.equal(assignments.signal.aborted, true);
});

test('async state ignores stale resolve/reject completions', () => {
  let state = idleAsync<string>();
  state = beginAsync(state, 10);
  const staleResolve = resolveAsync(state, 9, 'stale');
  assert.equal(staleResolve, state);

  state = resolveAsync(state, 10, 'fresh');
  assert.equal(state.status, 'ready');
  assert.equal(state.data, 'fresh');

  state = beginAsync(state, 11);
  const staleReject = rejectAsync(state, 10, appFailure('remote', 'Retry later.', true));
  assert.equal(staleReject, state);
});

test('safe error normalization does not expose arbitrary backend messages', () => {
  const unknown = toSafeFailure({ status: 418, message: 'private backend detail: token=secret' });
  assert.equal(unknown.kind, 'unknown');
  assert.doesNotMatch(unknown.message, /secret|token/i);

  const unauthorized = toSafeFailure({ status: 401, message: 'raw auth service response' });
  assert.equal(unauthorized.kind, 'unauthorized');
  assert.equal(unauthorized.message, 'Sign in again to continue.');

  const explicit = appFailure('validation', 'Choose a congregation.');
  assert.deepEqual(toSafeFailure(new SafeAppError(explicit)), explicit);
});

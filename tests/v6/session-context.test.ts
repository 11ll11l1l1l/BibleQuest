import assert from 'node:assert/strict';
import test from 'node:test';

import { createSessionContextStore } from '../../src/v6/kernel/session-context.ts';

const membership = (userId: string, congregationId: string) => ({
  userId,
  congregationId,
  role: 'member' as const,
});

test('session context starts anonymous and exposes a stable snapshot', () => {
  const store = createSessionContextStore();
  assert.deepEqual(store.snapshot(), { status: 'anonymous', identity: null, memberships: [] });
});

test('authenticated session keeps only memberships owned by the authenticated identity', () => {
  const store = createSessionContextStore();
  const snapshot = store.setAuthenticated(
    { userId: 'user-a', email: 'a@example.test' },
    [membership('user-a', 'church-a'), membership('user-b', 'church-b')],
  );

  assert.equal(snapshot.status, 'authenticated');
  if (snapshot.status !== 'authenticated') return;
  assert.equal(snapshot.identity.userId, 'user-a');
  assert.deepEqual(snapshot.memberships, [membership('user-a', 'church-a')]);
});

test('authenticating and clear fail closed by removing identity and memberships', () => {
  const store = createSessionContextStore();
  store.setAuthenticated({ userId: 'user-a' }, [membership('user-a', 'church-a')]);

  assert.deepEqual(store.setAuthenticating(), {
    status: 'authenticating',
    identity: null,
    memberships: [],
  });
  assert.deepEqual(store.clear(), { status: 'anonymous', identity: null, memberships: [] });
});

test('blank authenticated identity is rejected without mutating the prior session', () => {
  const store = createSessionContextStore();
  assert.throws(() => store.setAuthenticated({ userId: '   ' }), /requires a userId/);
  assert.equal(store.snapshot().status, 'anonymous');
});

test('subscribers receive transitions and can unsubscribe', () => {
  const store = createSessionContextStore();
  const statuses: string[] = [];
  const unsubscribe = store.subscribe((snapshot) => statuses.push(snapshot.status));

  store.setAuthenticating();
  store.setAuthenticated({ userId: 'user-a' });
  unsubscribe();
  store.clear();

  assert.deepEqual(statuses, ['authenticating', 'authenticated']);
});

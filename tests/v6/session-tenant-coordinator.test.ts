import assert from 'node:assert/strict';
import test from 'node:test';

import { createSessionTenantCoordinator } from '../../src/v6/kernel/session-tenant-coordinator.ts';
import { createTenantContextStore } from '../../src/v6/kernel/tenant-context.ts';

const memberships = [
  { userId: 'user-a', congregationId: 'church-a', role: 'member' as const },
  { userId: 'user-a', congregationId: 'church-b', role: 'leader' as const },
];

test('session tenant coordinator honors a valid preferred congregation', () => {
  const tenant = createTenantContextStore();
  const coordinator = createSessionTenantCoordinator(tenant);

  const snapshot = coordinator.applySession(
    { status: 'authenticated', identity: { userId: 'user-a' }, memberships },
    'church-b',
  );

  assert.equal(snapshot.userId, 'user-a');
  assert.equal(snapshot.activeCongregationId, 'church-b');
  assert.deepEqual(tenant.scope(), { userId: 'user-a', congregationId: 'church-b', generation: snapshot.generation });
});

test('session tenant coordinator rejects memberships owned by a different identity', () => {
  const tenant = createTenantContextStore();
  const coordinator = createSessionTenantCoordinator(tenant);

  const snapshot = coordinator.applySession({
    status: 'authenticated',
    identity: { userId: 'user-b' },
    memberships,
  });

  assert.equal(snapshot.userId, 'user-b');
  assert.deepEqual(snapshot.memberships, []);
  assert.equal(snapshot.activeCongregationId, null);
  assert.throws(() => tenant.scope(), /Choose an active congregation/);
});

test('sign-out clears tenant authority and invalidates an old request scope', () => {
  const tenant = createTenantContextStore();
  const coordinator = createSessionTenantCoordinator(tenant);

  coordinator.applySession({ status: 'authenticated', identity: { userId: 'user-a' }, memberships });
  const oldScope = tenant.scope();
  const before = tenant.snapshot().generation;

  const signedOut = coordinator.applySession({ status: 'anonymous', identity: null, memberships: [] });

  assert.equal(signedOut.userId, '');
  assert.equal(signedOut.activeCongregationId, null);
  assert.deepEqual(signedOut.memberships, []);
  assert.ok(signedOut.generation > before);
  assert.throws(() => tenant.assertCurrent(oldScope), /active congregation changed/);
});

test('authenticating state clears tenant authority', () => {
  const tenant = createTenantContextStore();
  const coordinator = createSessionTenantCoordinator(tenant);

  coordinator.applySession({ status: 'authenticated', identity: { userId: 'user-a' }, memberships });
  const pending = coordinator.applySession({ status: 'authenticating', identity: null, memberships });

  assert.equal(pending.userId, '');
  assert.equal(pending.activeCongregationId, null);
  assert.deepEqual(pending.memberships, []);
});

test('account switch invalidates prior-user scope before establishing the next tenant', () => {
  const tenant = createTenantContextStore();
  const coordinator = createSessionTenantCoordinator(tenant);

  coordinator.applySession({ status: 'authenticated', identity: { userId: 'user-a' }, memberships });
  const oldScope = tenant.scope();

  const next = coordinator.applySession({
    status: 'authenticated',
    identity: { userId: 'user-b' },
    memberships: [{ userId: 'user-b', congregationId: 'church-c', role: 'member' }],
  });

  assert.equal(next.userId, 'user-b');
  assert.equal(next.activeCongregationId, 'church-c');
  assert.throws(() => tenant.assertCurrent(oldScope), /active congregation changed/);
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createFeatureCompatibilitySeam,
  projectSurfaceState,
  routeAllowed,
  type AppRouteContract,
  type SessionSnapshot,
} from '../../src/v6/kernel/app-contracts.ts';
import { beginAsync, idleAsync, rejectAsync, resolveAsync } from '../../src/v6/kernel/async-state.ts';
import { createTenantContextStore } from '../../src/v6/kernel/tenant-context.ts';

const publicRoute: AppRouteContract = Object.freeze({ id: 'sign-in', path: '/login', access: 'public' });
const accountRoute: AppRouteContract = Object.freeze({ id: 'profile', path: '/profile', access: 'authenticated' });
const tenantRoute: AppRouteContract = Object.freeze({ id: 'calendar', path: '/calendar', access: 'congregation' });

const anonymous: SessionSnapshot = Object.freeze({ status: 'anonymous', identity: null, memberships: [] });

test('route contract keeps public, authenticated and congregation access distinct', () => {
  const tenant = createTenantContextStore();
  assert.equal(routeAllowed(publicRoute, { session: anonymous, tenant: tenant.snapshot() }), true);
  assert.equal(routeAllowed(accountRoute, { session: anonymous, tenant: tenant.snapshot() }), false);

  const memberships = [Object.freeze({ congregationId: 'cong-a', userId: 'user-a', role: 'member' as const })];
  tenant.reconcile('user-a', memberships);
  const authenticated: SessionSnapshot = Object.freeze({
    status: 'authenticated',
    identity: Object.freeze({ userId: 'user-a' }),
    memberships,
  });
  assert.equal(routeAllowed(accountRoute, { session: authenticated, tenant: tenant.snapshot() }), true);
  assert.equal(routeAllowed(tenantRoute, { session: authenticated, tenant: tenant.snapshot() }), true);

  tenant.clear();
  assert.equal(routeAllowed(tenantRoute, { session: authenticated, tenant: tenant.snapshot() }), false);
});

test('congregation route fails closed when tenant context drifts from authenticated memberships', () => {
  const tenant = createTenantContextStore();
  const memberships = [Object.freeze({ congregationId: 'cong-a', userId: 'user-a', role: 'member' as const })];
  tenant.reconcile('user-a', memberships);
  const staleTenant = Object.freeze({ ...tenant.snapshot(), activeCongregationId: 'cong-b' });
  const authenticated: SessionSnapshot = Object.freeze({
    status: 'authenticated',
    identity: Object.freeze({ userId: 'user-a' }),
    memberships,
  });

  assert.equal(routeAllowed(tenantRoute, { session: authenticated, tenant: staleTenant }), false);

  const mismatchedOwner: SessionSnapshot = Object.freeze({
    status: 'authenticated',
    identity: Object.freeze({ userId: 'user-b' }),
    memberships,
  });
  assert.equal(routeAllowed(tenantRoute, { session: mismatchedOwner, tenant: tenant.snapshot() }), false);
});

test('feature compatibility seam is explicit and fail-closed', () => {
  const compatibility = createFeatureCompatibilitySeam({ 'v6-simple-slice': true, reader: false });
  assert.equal(compatibility.enabled('v6-simple-slice'), true);
  assert.equal(compatibility.enabled('reader'), false);
  assert.equal(compatibility.enabled('unknown'), false);
  assert.equal(compatibility.enabled(''), false);
});

test('surface projection standardizes empty, loading and ready states', () => {
  const tenant = createTenantContextStore();
  const shell = { session: anonymous, tenant: tenant.snapshot(), route: publicRoute, online: true } as const;

  assert.deepEqual(projectSurfaceState(idleAsync<string>(), shell), { kind: 'empty', data: null });
  const loading = beginAsync(idleAsync<string>(), 1);
  assert.deepEqual(projectSurfaceState(loading, shell), { kind: 'loading', data: null });
  assert.deepEqual(projectSurfaceState(resolveAsync(loading, 1, 'ready'), shell), { kind: 'ready', data: 'ready' });
});

test('surface projection fails closed before exposing cached protected data', () => {
  const tenant = createTenantContextStore();
  const cached = resolveAsync(beginAsync(idleAsync<string>('cached'), 1), 1, 'cached');
  const state = projectSurfaceState(cached, {
    session: anonymous,
    tenant: tenant.snapshot(),
    route: accountRoute,
    online: true,
  });

  assert.equal(state.kind, 'unauthorized');
  assert.equal(state.data, null);
});

test('surface projection standardizes offline and request failures', () => {
  const tenant = createTenantContextStore();
  const shell = { session: anonymous, tenant: tenant.snapshot(), route: publicRoute, online: false } as const;
  const loading = beginAsync(idleAsync<string>('cached'), 1);
  const offline = projectSurfaceState(loading, shell);
  assert.equal(offline.kind, 'offline');
  assert.equal(offline.data, 'cached');

  const onlineShell = { ...shell, online: true } as const;
  const forbidden = rejectAsync(loading, 1, {
    kind: 'forbidden',
    message: 'Denied',
    retryable: false,
  });
  assert.equal(projectSurfaceState(forbidden, onlineShell).kind, 'unauthorized');

  const remote = rejectAsync(loading, 1, {
    kind: 'remote',
    message: 'Remote failure',
    retryable: true,
  });
  assert.equal(projectSurfaceState(remote, onlineShell).kind, 'error');
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createFeatureCompatibilitySeam,
  routeAllowed,
  type AppRouteContract,
  type SessionSnapshot,
} from '../../src/v6/kernel/app-contracts.ts';
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

test('feature compatibility seam is explicit and fail-closed', () => {
  const compatibility = createFeatureCompatibilitySeam({ 'v6-simple-slice': true, reader: false });
  assert.equal(compatibility.enabled('v6-simple-slice'), true);
  assert.equal(compatibility.enabled('reader'), false);
  assert.equal(compatibility.enabled('unknown'), false);
  assert.equal(compatibility.enabled(''), false);
});

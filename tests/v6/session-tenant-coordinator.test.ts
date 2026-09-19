import { describe, expect, it } from 'vitest';
import { createSessionTenantCoordinator } from '../../src/v6/kernel/session-tenant-coordinator.ts';
import { createTenantContextStore } from '../../src/v6/kernel/tenant-context.ts';

const memberships = [
  { userId: 'user-a', congregationId: 'church-a', role: 'member' as const },
  { userId: 'user-a', congregationId: 'church-b', role: 'leader' as const },
];

describe('session tenant coordinator', () => {
  it('reconciles authenticated memberships and honors a valid preferred congregation', () => {
    const tenant = createTenantContextStore();
    const coordinator = createSessionTenantCoordinator(tenant);

    const snapshot = coordinator.applySession(
      { status: 'authenticated', identity: { userId: 'user-a' }, memberships },
      'church-b',
    );

    expect(snapshot.userId).toBe('user-a');
    expect(snapshot.activeCongregationId).toBe('church-b');
    expect(tenant.scope()).toMatchObject({ userId: 'user-a', congregationId: 'church-b' });
  });

  it('never accepts memberships owned by a different identity', () => {
    const tenant = createTenantContextStore();
    const coordinator = createSessionTenantCoordinator(tenant);

    const snapshot = coordinator.applySession({
      status: 'authenticated',
      identity: { userId: 'user-b' },
      memberships,
    });

    expect(snapshot.userId).toBe('user-b');
    expect(snapshot.memberships).toEqual([]);
    expect(snapshot.activeCongregationId).toBeNull();
    expect(() => tenant.scope()).toThrow(/Choose an active congregation/);
  });

  it('clears tenant authority during sign-out and invalidates an old request scope', () => {
    const tenant = createTenantContextStore();
    const coordinator = createSessionTenantCoordinator(tenant);

    coordinator.applySession({ status: 'authenticated', identity: { userId: 'user-a' }, memberships });
    const oldScope = tenant.scope();
    const before = tenant.snapshot().generation;

    const signedOut = coordinator.applySession({ status: 'anonymous', identity: null, memberships: [] });

    expect(signedOut.userId).toBe('');
    expect(signedOut.activeCongregationId).toBeNull();
    expect(signedOut.memberships).toEqual([]);
    expect(signedOut.generation).toBeGreaterThan(before);
    expect(() => tenant.assertCurrent(oldScope)).toThrow(/active congregation changed/);
  });

  it('clears tenant authority while authentication is unresolved', () => {
    const tenant = createTenantContextStore();
    const coordinator = createSessionTenantCoordinator(tenant);

    coordinator.applySession({ status: 'authenticated', identity: { userId: 'user-a' }, memberships });
    const pending = coordinator.applySession({ status: 'authenticating', identity: null, memberships });

    expect(pending.userId).toBe('');
    expect(pending.activeCongregationId).toBeNull();
    expect(pending.memberships).toEqual([]);
  });

  it('invalidates prior-user scope before establishing the next account tenant', () => {
    const tenant = createTenantContextStore();
    const coordinator = createSessionTenantCoordinator(tenant);

    coordinator.applySession({ status: 'authenticated', identity: { userId: 'user-a' }, memberships });
    const oldScope = tenant.scope();

    const next = coordinator.applySession({
      status: 'authenticated',
      identity: { userId: 'user-b' },
      memberships: [{ userId: 'user-b', congregationId: 'church-c', role: 'member' }],
    });

    expect(next.userId).toBe('user-b');
    expect(next.activeCongregationId).toBe('church-c');
    expect(() => tenant.assertCurrent(oldScope)).toThrow(/active congregation changed/);
  });
});

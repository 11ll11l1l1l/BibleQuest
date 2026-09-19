import type { AppFailure } from './async-state.ts';
import type { TenantMembership, TenantSnapshot } from './tenant-context.ts';

export type SessionStatus = 'anonymous' | 'authenticating' | 'authenticated';

export interface AuthenticatedIdentity {
  readonly userId: string;
  readonly email?: string | null;
}

export type SessionSnapshot =
  | Readonly<{ status: 'anonymous'; identity: null; memberships: readonly [] }>
  | Readonly<{ status: 'authenticating'; identity: null; memberships: readonly TenantMembership[] }>
  | Readonly<{
      status: 'authenticated';
      identity: AuthenticatedIdentity;
      memberships: readonly TenantMembership[];
    }>;

export type RouteAccess = 'public' | 'authenticated' | 'congregation';

export interface AppRouteContract {
  readonly id: string;
  readonly path: string;
  readonly access: RouteAccess;
  readonly featureFlag?: string;
}

export interface AppShellSnapshot {
  readonly session: SessionSnapshot;
  readonly tenant: TenantSnapshot;
  readonly route: AppRouteContract;
  readonly online: boolean;
}

export type SurfaceState<T> =
  | Readonly<{ kind: 'loading'; data: T | null }>
  | Readonly<{ kind: 'ready'; data: T }>
  | Readonly<{ kind: 'empty'; data: null }>
  | Readonly<{ kind: 'offline'; data: T | null; failure: AppFailure }>
  | Readonly<{ kind: 'unauthorized'; data: null; failure: AppFailure }>
  | Readonly<{ kind: 'error'; data: T | null; failure: AppFailure }>;

export interface FeatureCompatibilitySeam {
  readonly enabled: (feature: string) => boolean;
}

export function createFeatureCompatibilitySeam(
  flags: Readonly<Record<string, boolean>> = Object.freeze({}),
): FeatureCompatibilitySeam {
  const snapshot = Object.freeze({ ...flags });
  return Object.freeze({ enabled: (feature: string) => snapshot[String(feature ?? '').trim()] === true });
}

function sessionOwnsActiveCongregation(session: SessionSnapshot, tenant: TenantSnapshot): boolean {
  if (session.status !== 'authenticated' || !tenant.activeCongregationId) return false;
  const activeCongregationId = tenant.activeCongregationId;
  const userId = session.identity.userId;
  return session.memberships.some(
    (membership) => membership.userId === userId && membership.congregationId === activeCongregationId,
  );
}

export function routeAllowed(route: AppRouteContract, shell: Pick<AppShellSnapshot, 'session' | 'tenant'>): boolean {
  if (route.access === 'public') return true;
  if (shell.session.status !== 'authenticated') return false;
  if (route.access === 'authenticated') return true;
  return sessionOwnsActiveCongregation(shell.session, shell.tenant);
}

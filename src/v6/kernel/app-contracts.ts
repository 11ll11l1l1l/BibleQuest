import type { AppFailure, AsyncState } from './async-state.ts';
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

const unauthorizedFailure: AppFailure = Object.freeze({
  kind: 'unauthorized',
  message: 'This surface is not available for the current session and congregation.',
  retryable: false,
});

const offlineFailure: AppFailure = Object.freeze({
  kind: 'offline',
  message: 'This surface is unavailable while offline.',
  retryable: true,
});

/**
 * Projects kernel request state into the complete UI-facing state contract.
 * Access is checked before request state so stale cached data can never make a
 * protected surface visible after sign-out or tenant drift.
 */
export function projectSurfaceState<T>(
  state: AsyncState<T>,
  shell: Pick<AppShellSnapshot, 'session' | 'tenant' | 'route' | 'online'>,
): SurfaceState<T> {
  if (!routeAllowed(shell.route, shell)) {
    return Object.freeze({ kind: 'unauthorized', data: null, failure: unauthorizedFailure });
  }

  if (state.status === 'error') {
    if (state.failure.kind === 'offline') {
      return Object.freeze({ kind: 'offline', data: state.data, failure: state.failure });
    }
    if (state.failure.kind === 'unauthorized' || state.failure.kind === 'forbidden') {
      return Object.freeze({ kind: 'unauthorized', data: null, failure: state.failure });
    }
    return Object.freeze({ kind: 'error', data: state.data, failure: state.failure });
  }

  if (!shell.online && state.status !== 'ready') {
    return Object.freeze({ kind: 'offline', data: state.data, failure: offlineFailure });
  }

  if (state.status === 'loading') return Object.freeze({ kind: 'loading', data: state.data });
  if (state.status === 'ready') return Object.freeze({ kind: 'ready', data: state.data });
  if (state.data !== null) return Object.freeze({ kind: 'ready', data: state.data });
  return Object.freeze({ kind: 'empty', data: null });
}

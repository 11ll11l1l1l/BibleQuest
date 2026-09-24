import { createTenantContextStore, type TenantContextStore, type TenantSnapshot } from './tenant-context.ts';
import type { LegacySessionState } from './legacy-session-bridge.ts';

export interface LegacyTenantStore {
  readonly getState: () => Readonly<{ session?: LegacySessionState | null }>;
  readonly subscribe: (listener: (state: Readonly<{ session?: LegacySessionState | null }>) => void) => () => void;
}

export interface LegacyCongregationMembership {
  readonly congregationId: string;
  readonly userId: string;
  readonly role?: string | null;
}

export interface LegacyCongregationSnapshot {
  readonly userId: string;
  readonly activeCongregationId: string;
  readonly memberships: readonly LegacyCongregationMembership[];
}

export interface LegacyCongregationContextSource {
  readonly snapshot: () => LegacyCongregationSnapshot;
  readonly subscribe: (listener: (snapshot: LegacyCongregationSnapshot) => void) => () => void;
}

export interface LegacyTenantRuntime {
  readonly tenant: TenantContextStore;
  readonly sync: () => TenantSnapshot;
  readonly dispose: () => void;
}

export type TenantGenerationObserver = (
  current: TenantSnapshot,
  previous: TenantSnapshot,
) => void | Promise<unknown>;

function currentIdentity(store: LegacyTenantStore): string {
  const session = store.getState()?.session;
  return session?.authenticated === true ? String(session.user?.id ?? '').trim() : '';
}

/**
 * Projects the live V5 congregation owner into the typed V6 tenant context.
 *
 * The legacy session remains authentication authority and the legacy
 * congregation owner remains membership/role authority during migration.
 * This bridge owns no permissions and never infers memberships. A session
 * switch immediately fails closed because congregation snapshots from the
 * previous user are ignored until the new user's memberships are loaded.
 */
export function bindLegacyTenantRuntime(
  store: LegacyTenantStore,
  congregation: LegacyCongregationContextSource,
  onGeneration?: TenantGenerationObserver,
): LegacyTenantRuntime {
  if (!store?.getState || !store?.subscribe || !congregation?.snapshot || !congregation?.subscribe) {
    throw new Error('Legacy tenant binding requires session store and congregation context owners.');
  }

  const tenant = createTenantContextStore();
  let disposed = false;

  const sync = (): TenantSnapshot => {
    if (disposed) return tenant.snapshot();
    const userId = currentIdentity(store);
    const previous = tenant.snapshot();

    let next: TenantSnapshot;
    if (!userId) {
      next = tenant.clear();
    } else {
      const legacy = congregation.snapshot();
      const memberships = legacy.userId === userId
        ? legacy.memberships.map((membership) => Object.freeze({
          userId,
          congregationId: String(membership.congregationId ?? '').trim(),
          role: membership.role ?? null,
        }))
        : [];
      const preferred = legacy.userId === userId ? legacy.activeCongregationId : null;
      next = tenant.reconcile(userId, memberships, preferred);
    }

    if (next.generation !== previous.generation) void Promise.resolve(onGeneration?.(next, previous));
    return next;
  };

  const unsubscribeSession = store.subscribe(() => { sync(); });
  const unsubscribeCongregation = congregation.subscribe(() => { sync(); });
  sync();

  return Object.freeze({
    tenant,
    sync,
    dispose() {
      if (disposed) return;
      disposed = true;
      unsubscribeSession();
      unsubscribeCongregation();
    },
  });
}

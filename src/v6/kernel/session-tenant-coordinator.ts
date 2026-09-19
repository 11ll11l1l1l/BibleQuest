import type { SessionSnapshot } from './app-contracts.ts';
import type { TenantContextStore, TenantSnapshot } from './tenant-context.ts';

export interface SessionTenantCoordinator {
  readonly applySession: (session: SessionSnapshot, preferredCongregationId?: string | null) => TenantSnapshot;
}

/**
 * Keeps authentication identity and tenant authority synchronized without making
 * either one an implicit global dependency. Anonymous/authenticating states
 * always clear tenant authority; authenticated sessions are reconciled only
 * from memberships belonging to the current identity.
 */
export function createSessionTenantCoordinator(tenant: TenantContextStore): SessionTenantCoordinator {
  const applySession = (
    session: SessionSnapshot,
    preferredCongregationId: string | null = null,
  ): TenantSnapshot => {
    if (session.status !== 'authenticated') {
      return tenant.clear();
    }

    return tenant.reconcile(
      session.identity.userId,
      session.memberships,
      preferredCongregationId,
    );
  };

  return Object.freeze({ applySession });
}

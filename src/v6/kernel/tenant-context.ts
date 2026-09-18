export type CongregationRole = 'member' | 'facilitator' | 'leader' | 'pastor' | 'admin';

export interface TenantMembership {
  readonly congregationId: string;
  readonly userId: string;
  readonly role: CongregationRole | null;
}

export interface TenantScope {
  readonly userId: string;
  readonly congregationId: string;
  readonly generation: number;
}

export interface TenantSnapshot {
  readonly userId: string;
  readonly activeCongregationId: string | null;
  readonly memberships: readonly TenantMembership[];
  readonly generation: number;
}

export type TenantContextErrorCode =
  | 'BQ_TENANT_AUTH_REQUIRED'
  | 'BQ_TENANT_MEMBERSHIP_REQUIRED'
  | 'BQ_TENANT_CONTEXT_STALE';

export class TenantContextError extends Error {
  readonly code: TenantContextErrorCode;

  constructor(code: TenantContextErrorCode, message: string) {
    super(message);
    this.name = 'TenantContextError';
    this.code = code;
  }
}

const KNOWN_ROLES = new Set<CongregationRole>(['member', 'facilitator', 'leader', 'pastor', 'admin']);

function cleanId(value: unknown): string {
  return String(value ?? '').trim();
}

function cleanRole(value: unknown): CongregationRole | null {
  const role = String(value ?? '').trim().toLowerCase() as CongregationRole;
  return KNOWN_ROLES.has(role) ? role : null;
}

function freezeMembership(input: TenantMembership): TenantMembership {
  return Object.freeze({
    congregationId: cleanId(input.congregationId),
    userId: cleanId(input.userId),
    role: cleanRole(input.role),
  });
}

function membershipSignature(rows: readonly TenantMembership[]): string {
  return rows
    .map((row) => `${row.congregationId}:${row.userId}:${row.role ?? ''}`)
    .sort()
    .join('|');
}

export interface TenantContextStore {
  readonly snapshot: () => TenantSnapshot;
  readonly reconcile: (
    userId: string,
    memberships: readonly TenantMembership[],
    preferredCongregationId?: string | null,
  ) => TenantSnapshot;
  readonly setActive: (congregationId: string) => TenantSnapshot;
  readonly scope: () => TenantScope;
  readonly assertCurrent: (scope: TenantScope) => true;
  readonly clear: () => TenantSnapshot;
}

export function createTenantContextStore(): TenantContextStore {
  let userId = '';
  let activeCongregationId = '';
  let memberships: readonly TenantMembership[] = Object.freeze([]);
  let generation = 0;

  const snapshot = (): TenantSnapshot =>
    Object.freeze({
      userId,
      activeCongregationId: activeCongregationId || null,
      memberships,
      generation,
    });

  const findMembership = (congregationId: string): TenantMembership | null =>
    memberships.find((row) => row.congregationId === congregationId) ?? null;

  const reconcile = (
    nextUserIdRaw: string,
    incoming: readonly TenantMembership[],
    preferredCongregationIdRaw: string | null = null,
  ): TenantSnapshot => {
    const nextUserId = cleanId(nextUserIdRaw);
    if (!nextUserId) {
      throw new TenantContextError('BQ_TENANT_AUTH_REQUIRED', 'Authenticated identity is required.');
    }

    const nextMemberships = Object.freeze(
      incoming
        .map(freezeMembership)
        .filter((row) => row.userId === nextUserId && row.congregationId.length > 0),
    );

    const identityChanged = userId !== nextUserId;
    const previousSignature = membershipSignature(memberships);
    const nextSignature = membershipSignature(nextMemberships);
    const membershipsChanged = previousSignature !== nextSignature;

    userId = nextUserId;
    memberships = nextMemberships;

    const preferredCongregationId = cleanId(preferredCongregationIdRaw);
    const validCurrent = !identityChanged && activeCongregationId && findMembership(activeCongregationId);
    const validPreferred = preferredCongregationId && findMembership(preferredCongregationId);
    const nextActive = validPreferred
      ? preferredCongregationId
      : validCurrent
        ? activeCongregationId
        : memberships[0]?.congregationId ?? '';

    const activeChanged = activeCongregationId !== nextActive;
    activeCongregationId = nextActive;

    if (identityChanged || membershipsChanged || activeChanged) generation += 1;
    return snapshot();
  };

  const setActive = (congregationIdRaw: string): TenantSnapshot => {
    if (!userId) {
      throw new TenantContextError('BQ_TENANT_AUTH_REQUIRED', 'Authenticated identity is required.');
    }
    const congregationId = cleanId(congregationIdRaw);
    const membership = findMembership(congregationId);
    if (!membership || membership.userId !== userId) {
      throw new TenantContextError(
        'BQ_TENANT_MEMBERSHIP_REQUIRED',
        'The selected congregation is not available for this account.',
      );
    }
    if (activeCongregationId !== congregationId) {
      activeCongregationId = congregationId;
      generation += 1;
    }
    return snapshot();
  };

  const scope = (): TenantScope => {
    if (!userId) {
      throw new TenantContextError('BQ_TENANT_AUTH_REQUIRED', 'Authenticated identity is required.');
    }
    if (!activeCongregationId || !findMembership(activeCongregationId)) {
      throw new TenantContextError(
        'BQ_TENANT_MEMBERSHIP_REQUIRED',
        'Choose an active congregation before loading congregation data.',
      );
    }
    return Object.freeze({ userId, congregationId: activeCongregationId, generation });
  };

  const assertCurrent = (candidate: TenantScope): true => {
    if (
      candidate.userId !== userId ||
      candidate.congregationId !== activeCongregationId ||
      candidate.generation !== generation ||
      !findMembership(candidate.congregationId)
    ) {
      throw new TenantContextError(
        'BQ_TENANT_CONTEXT_STALE',
        'The active congregation changed while this request was running.',
      );
    }
    return true;
  };

  const clear = (): TenantSnapshot => {
    if (userId || activeCongregationId || memberships.length) generation += 1;
    userId = '';
    activeCongregationId = '';
    memberships = Object.freeze([]);
    return snapshot();
  };

  return Object.freeze({ snapshot, reconcile, setActive, scope, assertCurrent, clear });
}

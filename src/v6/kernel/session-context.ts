import type { SessionSnapshot } from './app-contracts.ts';

export interface SessionContextStore {
  readonly snapshot: () => SessionSnapshot;
  readonly setAuthenticating: () => SessionSnapshot;
  readonly setAuthenticated: (
    identity: Readonly<{ userId: string; email?: string | null }>,
    memberships?: SessionSnapshot['memberships'],
  ) => SessionSnapshot;
  readonly clear: () => SessionSnapshot;
  readonly subscribe: (listener: (snapshot: SessionSnapshot) => void) => () => void;
}

const emptyAnonymousMemberships: readonly [] = Object.freeze([]);
const anonymousSession = (): SessionSnapshot =>
  Object.freeze({ status: 'anonymous', identity: null, memberships: emptyAnonymousMemberships });

function normalizeUserId(userId: string): string {
  const normalized = String(userId ?? '').trim();
  if (!normalized) throw new Error('Authenticated session requires a userId.');
  return normalized;
}

/**
 * Narrow owner for client authentication state. It deliberately owns identity
 * and membership snapshots only; active-congregation authority remains in the
 * tenant context and is reconciled by SessionTenantCoordinator.
 */
export function createSessionContextStore(initial: SessionSnapshot = anonymousSession()): SessionContextStore {
  let current = initial;
  const listeners = new Set<(snapshot: SessionSnapshot) => void>();

  const publish = (next: SessionSnapshot): SessionSnapshot => {
    current = next;
    for (const listener of listeners) listener(current);
    return current;
  };

  const setAuthenticating = (): SessionSnapshot =>
    publish(Object.freeze({ status: 'authenticating', identity: null, memberships: Object.freeze([]) }));

  const setAuthenticated: SessionContextStore['setAuthenticated'] = (identity, memberships = []) => {
    const userId = normalizeUserId(identity.userId);
    const ownedMemberships = memberships.filter((membership) => membership.userId === userId);
    const nextIdentity = Object.freeze({ userId, email: identity.email ?? null });
    return publish(
      Object.freeze({
        status: 'authenticated',
        identity: nextIdentity,
        memberships: Object.freeze([...ownedMemberships]),
      }),
    );
  };

  const clear = (): SessionSnapshot => publish(anonymousSession());

  const subscribe = (listener: (snapshot: SessionSnapshot) => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return Object.freeze({ snapshot: () => current, setAuthenticating, setAuthenticated, clear, subscribe });
}

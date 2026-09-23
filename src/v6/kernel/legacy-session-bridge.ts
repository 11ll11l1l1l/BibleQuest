import type { SessionContextStore } from './session-context.ts';

export interface LegacySessionState {
  readonly status?: string;
  readonly authenticated?: boolean;
  readonly user?: Readonly<{ id?: string | null; email?: string | null }> | null;
}

export interface LegacySessionBridge {
  readonly sync: (state: LegacySessionState | null | undefined) => void;
  readonly dispose: () => void;
}

/**
 * Compatibility bridge for the bounded V5 -> V6 session migration.
 *
 * The legacy session service remains the live authentication authority while
 * the typed V6 context projects only identity state needed by migrated domain
 * services. Membership/tenant authority is deliberately not inferred here.
 * Repeated legacy store publications are deduplicated so account-backed owners
 * are not re-resumed for unrelated UI/store updates.
 */
export function createLegacySessionBridge(
  context: SessionContextStore,
  onAuthenticated?: (userId: string) => void | Promise<unknown>,
): LegacySessionBridge {
  let disposed = false;
  let lastKey = '';

  function sync(state: LegacySessionState | null | undefined): void {
    if (disposed) return;
    const authenticated = state?.authenticated === true;
    const userId = authenticated ? String(state?.user?.id ?? '').trim() : '';
    const status = String(state?.status ?? '');
    const key = `${status}:${authenticated ? '1' : '0'}:${userId}`;
    if (key === lastKey) return;
    lastKey = key;

    if (status === 'booting' || status === 'authenticating') {
      context.setAuthenticating();
      return;
    }
    if (!authenticated || !userId) {
      context.clear();
      return;
    }

    context.setAuthenticated({ userId, email: state?.user?.email ?? null });
    void Promise.resolve(onAuthenticated?.(userId));
  }

  function dispose(): void {
    disposed = true;
  }

  return Object.freeze({ sync, dispose });
}

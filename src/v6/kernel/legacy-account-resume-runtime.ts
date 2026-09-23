import { createAccountResumeCoordinator, type AccountResumeOwner } from './account-resume-coordinator.ts';
import { createLegacySessionBridge, type LegacySessionState } from './legacy-session-bridge.ts';
import { createSessionContextStore } from './session-context.ts';

export interface LegacyAccountResumeRuntime {
  readonly syncSession: (state: LegacySessionState | null | undefined) => void;
  readonly dispose: () => void;
}

export interface LegacyAccountResumeStore {
  readonly getState: () => Readonly<{ session?: LegacySessionState | null }>;
  readonly subscribe: (listener: (state: Readonly<{ session?: LegacySessionState | null }>) => void) => () => void;
}

/**
 * Bounded V5 -> V6 composition seam for account-backed product state.
 *
 * The legacy session remains authentication authority. This runtime projects
 * that identity into the typed V6 session context and lets the account resume
 * coordinator invoke the existing cloud-sync owners exactly once per session
 * generation. It does not own remote merge/conflict algorithms, scoring,
 * tenant membership, or backend authorization.
 */
export function createLegacyAccountResumeRuntime(
  owners: readonly AccountResumeOwner[],
  onCurrentResume?: () => void | Promise<unknown>,
): LegacyAccountResumeRuntime {
  const context = createSessionContextStore();
  const coordinator = createAccountResumeCoordinator(context, owners);
  let disposed = false;

  const bridge = createLegacySessionBridge(context, async () => {
    const result = await coordinator.resumeCurrentAccount();
    if (!disposed && result?.current) await onCurrentResume?.();
  });

  function syncSession(state: LegacySessionState | null | undefined): void {
    if (!disposed) bridge.sync(state);
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    bridge.dispose();
    coordinator.dispose();
  }

  return Object.freeze({ syncSession, dispose });
}

/**
 * Owns the narrow legacy-store subscription needed by the live bootstrap
 * cutover. The store remains the V5 session authority; only its session slice
 * is projected into the V6 runtime. Subscribing before the initial snapshot
 * prevents an auth transition from being missed between setup steps, while the
 * bridge's publication deduplication prevents duplicate resume work.
 */
export function bindLegacyAccountResumeRuntime(
  store: LegacyAccountResumeStore,
  owners: readonly AccountResumeOwner[],
  onCurrentResume?: () => void | Promise<unknown>,
): LegacyAccountResumeRuntime {
  if (!store?.getState || !store?.subscribe) throw new Error('Legacy account resume binding requires a store owner.');
  const runtime = createLegacyAccountResumeRuntime(owners, onCurrentResume);
  let disposed = false;
  const sync = (state: Readonly<{ session?: LegacySessionState | null }>) => runtime.syncSession(state?.session);
  const unsubscribe = store.subscribe(sync);
  sync(store.getState());

  return Object.freeze({
    syncSession: runtime.syncSession,
    dispose() {
      if (disposed) return;
      disposed = true;
      unsubscribe();
      runtime.dispose();
    },
  });
}

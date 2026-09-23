import { createAccountResumeCoordinator, type AccountResumeOwner } from './account-resume-coordinator.ts';
import { createLegacySessionBridge, type LegacySessionState } from './legacy-session-bridge.ts';
import { createSessionContextStore } from './session-context.ts';

export interface LegacyAccountResumeRuntime {
  readonly syncSession: (state: LegacySessionState | null | undefined) => void;
  readonly dispose: () => void;
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

import type { OfflineMutationPolicy } from './outbox.ts';

export type OfflineConflictResolution =
  | 'keep-local'
  | 'keep-server'
  | 'needs-user-resolution';

export interface OfflineConflictFacts {
  /**
   * True when the local mutation changes the entity relative to the version
   * observed when the mutation was created.
   */
  readonly localChanged: boolean;
  /**
   * True when the authoritative server entity changed since the local
   * mutation's base/precondition version.
   */
  readonly serverChanged: boolean;
  /**
   * True only when the domain adapter has proved that local and server state
   * are semantically equivalent. Raw object/string comparison is not enough.
   */
  readonly semanticallyEquivalent?: boolean;
}

export interface OfflineConflictDecision {
  readonly resolution: OfflineConflictResolution;
  readonly reason:
    | 'unsafe-policy'
    | 'equivalent'
    | 'local-only-change'
    | 'server-only-change'
    | 'concurrent-change'
    | 'no-change';
}

function isAutomaticallyResolvablePolicy(
  policy: OfflineMutationPolicy | null | undefined,
): policy is OfflineMutationPolicy {
  return Boolean(
    policy
      && policy.queueable === true
      && policy.risk === 'safe-idempotent'
      && String(policy.domain ?? '').trim()
      && String(policy.operation ?? '').trim(),
  );
}

/**
 * Classifies a conflict without applying a mutation.
 *
 * This intentionally has no timestamps/last-write-wins fallback. Automatic
 * selection is available only to operations already certified safe and
 * idempotent, and only when the domain adapter proves that at most one side
 * changed from the common base (or that both states are equivalent).
 */
export function classifyOfflineConflict(
  policy: OfflineMutationPolicy | null | undefined,
  facts: OfflineConflictFacts,
): OfflineConflictDecision {
  if (!isAutomaticallyResolvablePolicy(policy)) {
    return Object.freeze({
      resolution: 'needs-user-resolution',
      reason: 'unsafe-policy',
    });
  }

  if (facts.semanticallyEquivalent === true) {
    return Object.freeze({
      resolution: 'keep-server',
      reason: 'equivalent',
    });
  }

  if (facts.localChanged && !facts.serverChanged) {
    return Object.freeze({
      resolution: 'keep-local',
      reason: 'local-only-change',
    });
  }

  if (!facts.localChanged && facts.serverChanged) {
    return Object.freeze({
      resolution: 'keep-server',
      reason: 'server-only-change',
    });
  }

  if (facts.localChanged && facts.serverChanged) {
    return Object.freeze({
      resolution: 'needs-user-resolution',
      reason: 'concurrent-change',
    });
  }

  return Object.freeze({
    resolution: 'keep-server',
    reason: 'no-change',
  });
}

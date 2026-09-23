import type { SessionContextStore } from './session-context.ts';

export interface AccountResumeOwner {
  readonly key: string;
  readonly syncNow: () => Promise<unknown>;
  readonly switchToGuest?: () => unknown;
}

export interface AccountResumeResult {
  readonly userId: string;
  readonly generation: number;
  readonly settled: readonly Readonly<{
    key: string;
    status: 'fulfilled' | 'rejected';
    reason?: unknown;
  }>[];
  readonly current: boolean;
}

export interface AccountResumeCoordinator {
  readonly resumeCurrentAccount: () => Promise<AccountResumeResult | null>;
  readonly dispose: () => void;
}

/**
 * Binds independent account-backed product owners to the typed V6 session
 * lifecycle. Owners settle independently so one unavailable slice never blocks
 * the others. Generation checks prevent a slow response for a previous account
 * from being reported as current after an account switch/sign-out.
 */
export function createAccountResumeCoordinator(
  session: SessionContextStore,
  owners: readonly AccountResumeOwner[],
): AccountResumeCoordinator {
  const uniqueKeys = new Set<string>();
  for (const owner of owners) {
    const key = String(owner.key ?? '').trim();
    if (!key) throw new Error('Account resume owner requires a stable key.');
    if (uniqueKeys.has(key)) throw new Error(`Duplicate account resume owner key: ${key}`);
    uniqueKeys.add(key);
  }

  let disposed = false;
  let generation = 0;

  const currentUserId = (): string => {
    const snapshot = session.snapshot();
    return snapshot.status === 'authenticated' ? snapshot.identity.userId : '';
  };

  async function resumeCurrentAccount(): Promise<AccountResumeResult | null> {
    if (disposed) return null;
    const userId = currentUserId();
    if (!userId) return null;
    const runGeneration = generation;
    const results = await Promise.allSettled(owners.map((owner) => owner.syncNow()));
    const settled = results.map((result, index) =>
      Object.freeze(
        result.status === 'fulfilled'
          ? { key: owners[index].key, status: 'fulfilled' as const }
          : { key: owners[index].key, status: 'rejected' as const, reason: result.reason },
      ),
    );
    const current = !disposed && runGeneration === generation && currentUserId() === userId;
    return Object.freeze({ userId, generation: runGeneration, settled: Object.freeze(settled), current });
  }

  const unsubscribe = session.subscribe((snapshot) => {
    generation += 1;
    if (snapshot.status !== 'authenticated') {
      for (const owner of owners) owner.switchToGuest?.();
      return;
    }
    void resumeCurrentAccount();
  });

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    generation += 1;
    unsubscribe();
  }

  return Object.freeze({ resumeCurrentAccount, dispose });
}

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
 * from being reported as current after an account switch/sign-out. Concurrent
 * requests for the same authenticated generation share one owner-sync pass so
 * session restoration and an eager consumer cannot duplicate remote work.
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
  let inFlight: { userId: string; generation: number; promise: Promise<AccountResumeResult> } | null = null;

  const currentUserId = (): string => {
    const snapshot = session.snapshot();
    return snapshot.status === 'authenticated' ? snapshot.identity.userId : '';
  };

  function resumeCurrentAccount(): Promise<AccountResumeResult | null> {
    if (disposed) return Promise.resolve(null);
    const userId = currentUserId();
    if (!userId) return Promise.resolve(null);
    const runGeneration = generation;
    if (inFlight?.userId === userId && inFlight.generation === runGeneration) return inFlight.promise;

    const promise = Promise.allSettled(owners.map((owner) => owner.syncNow())).then((results) => {
      const settled = results.map((result, index) =>
        Object.freeze(
          result.status === 'fulfilled'
            ? { key: owners[index].key, status: 'fulfilled' as const }
            : { key: owners[index].key, status: 'rejected' as const, reason: result.reason },
        ),
      );
      const current = !disposed && runGeneration === generation && currentUserId() === userId;
      return Object.freeze({ userId, generation: runGeneration, settled: Object.freeze(settled), current });
    });
    inFlight = { userId, generation: runGeneration, promise };
    void promise.finally(() => {
      if (inFlight?.promise === promise) inFlight = null;
    });
    return promise;
  }

  const unsubscribe = session.subscribe((snapshot) => {
    generation += 1;
    inFlight = null;
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
    inFlight = null;
    unsubscribe();
  }

  return Object.freeze({ resumeCurrentAccount, dispose });
}

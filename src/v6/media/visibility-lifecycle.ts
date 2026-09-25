import type { MediaSessionSnapshot } from './contracts.ts';

export interface MediaLifecycleEventTarget {
  readonly addEventListener: (type: string, listener: () => void) => void;
  readonly removeEventListener: (type: string, listener: () => void) => void;
}

export interface MediaVisibilityTarget extends MediaLifecycleEventTarget {
  readonly visibilityState?: string;
}

export interface MediaVisibilitySession {
  readonly snapshot: () => MediaSessionSnapshot;
  readonly pause: (instanceId: string) => void | Promise<unknown>;
}

export interface MediaVisibilityLifecycleState {
  readonly backgrounded: boolean;
  readonly resumeCandidateInstanceId: string | null;
  readonly lastError: string;
}

export function createMediaVisibilityLifecycle(input: {
  readonly session: MediaVisibilitySession;
  readonly visibilityTarget: MediaVisibilityTarget;
  readonly pageTarget?: MediaLifecycleEventTarget;
}) {
  const session = input?.session;
  const visibilityTarget = input?.visibilityTarget;
  const pageTarget = input?.pageTarget ?? visibilityTarget;

  if (!session || typeof session.snapshot !== 'function' || typeof session.pause !== 'function') {
    throw new Error('Media visibility lifecycle requires a session owner.');
  }
  if (!visibilityTarget
    || typeof visibilityTarget.addEventListener !== 'function'
    || typeof visibilityTarget.removeEventListener !== 'function'
    || !pageTarget
    || typeof pageTarget.addEventListener !== 'function'
    || typeof pageTarget.removeEventListener !== 'function') {
    throw new Error('Media visibility lifecycle requires browser event targets.');
  }

  let disposed = false;
  let backgrounded = false;
  let resumeCandidateInstanceId: string | null = null;
  let lastError = '';
  let pending = Promise.resolve();

  const state = (): MediaVisibilityLifecycleState => Object.freeze({
    backgrounded,
    resumeCandidateInstanceId,
    lastError,
  });

  const candidateStillPaused = (instanceId: string | null) => {
    if (!instanceId) return false;
    return session.snapshot().instances.some(
      (entry) => entry.instanceId === instanceId && entry.status === 'paused',
    );
  };

  const background = async () => {
    if (disposed || backgrounded) return;
    backgrounded = true;
    lastError = '';

    const activeInstanceId = session.snapshot().activeAudibleInstanceId;
    if (!activeInstanceId) {
      resumeCandidateInstanceId = null;
      return;
    }

    resumeCandidateInstanceId = activeInstanceId;
    try {
      await session.pause(activeInstanceId);
      if (!candidateStillPaused(activeInstanceId)) {
        resumeCandidateInstanceId = null;
      }
    } catch (error) {
      resumeCandidateInstanceId = null;
      lastError = error instanceof Error ? error.message : String(error || 'Media background pause failed.');
    }
  };

  const foreground = () => {
    if (disposed) return;
    backgrounded = false;
    lastError = '';
    if (!candidateStillPaused(resumeCandidateInstanceId)) {
      resumeCandidateInstanceId = null;
    }
  };

  const enqueue = (task: () => void | Promise<void>) => {
    pending = pending.then(task, task);
    return pending;
  };

  const onVisibilityChange = () => {
    if (visibilityTarget.visibilityState === 'hidden') {
      void enqueue(background);
      return;
    }
    if (visibilityTarget.visibilityState === 'visible') {
      void enqueue(foreground);
    }
  };
  const onPageHide = () => { void enqueue(background); };
  const onPageShow = () => { void enqueue(foreground); };

  visibilityTarget.addEventListener('visibilitychange', onVisibilityChange);
  pageTarget.addEventListener('pagehide', onPageHide);
  pageTarget.addEventListener('pageshow', onPageShow);

  if (visibilityTarget.visibilityState === 'hidden') {
    void enqueue(background);
  }

  return Object.freeze({
    snapshot: state,
    flush: () => pending,
    consumeResumeCandidate() {
      if (!candidateStillPaused(resumeCandidateInstanceId)) {
        resumeCandidateInstanceId = null;
        return null;
      }
      const candidate = resumeCandidateInstanceId;
      resumeCandidateInstanceId = null;
      return candidate;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      visibilityTarget.removeEventListener('visibilitychange', onVisibilityChange);
      pageTarget.removeEventListener('pagehide', onPageHide);
      pageTarget.removeEventListener('pageshow', onPageShow);
      resumeCandidateInstanceId = null;
    },
  });
}

export interface ConnectivitySnapshot {
  readonly online: boolean;
  readonly changedAt: number;
}

export interface ConnectivityStore {
  readonly snapshot: () => ConnectivitySnapshot;
  readonly subscribe: (listener: (snapshot: ConnectivitySnapshot) => void) => () => void;
  readonly dispose: () => void;
}

export interface ConnectivityEnvironment {
  readonly online: () => boolean;
  readonly addEventListener: (type: 'online' | 'offline', listener: () => void) => void;
  readonly removeEventListener: (type: 'online' | 'offline', listener: () => void) => void;
  readonly now?: () => number;
}

export function createConnectivityStore(environment: ConnectivityEnvironment): ConnectivityStore {
  if (!environment?.addEventListener || !environment?.removeEventListener || !environment?.online) {
    throw new Error('Connectivity store requires online state and event listeners.');
  }
  const now = environment.now ?? (() => Date.now());
  const listeners = new Set<(snapshot: ConnectivitySnapshot) => void>();
  let disposed = false;
  let current: ConnectivitySnapshot = Object.freeze({ online: Boolean(environment.online()), changedAt: now() });

  const publish = (): void => {
    if (disposed) return;
    const nextOnline = Boolean(environment.online());
    if (nextOnline === current.online) return;
    current = Object.freeze({ online: nextOnline, changedAt: now() });
    for (const listener of listeners) listener(current);
  };

  environment.addEventListener('online', publish);
  environment.addEventListener('offline', publish);

  return Object.freeze({
    snapshot: () => current,
    subscribe(listener) {
      if (typeof listener !== 'function') throw new Error('Connectivity subscriber must be a function.');
      if (disposed) throw new Error('Connectivity store is disposed.');
      listeners.add(listener);
      listener(current);
      return () => listeners.delete(listener);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      listeners.clear();
      environment.removeEventListener('online', publish);
      environment.removeEventListener('offline', publish);
    },
  });
}

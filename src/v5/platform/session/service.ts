import { guestSession, type SessionService, type SessionSnapshot, type SessionSource } from './contracts';

export function createSessionService(source: SessionSource): SessionService {
  let snapshot: SessionSnapshot = Object.freeze({
    status: 'booting', authenticated: false, remoteAvailable: true, user: null, error: ''
  });
  const listeners = new Set<(snapshot: SessionSnapshot) => void>();
  let unsubscribeSource: (() => void) | undefined;
  let bootPromise: Promise<SessionSnapshot> | undefined;

  const publish = (next: SessionSnapshot) => {
    snapshot = Object.freeze({ ...next });
    listeners.forEach((listener) => listener(snapshot));
    return snapshot;
  };

  return Object.freeze({
    boot() {
      if (bootPromise) return bootPromise;
      unsubscribeSource = source.subscribe?.(publish);
      bootPromise = source.read()
        .then(publish)
        .catch((error: unknown) => publish(guestSession(false, error instanceof Error ? error.message : 'Account service is unavailable.')));
      return bootPromise;
    },
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot);
      return () => listeners.delete(listener);
    },
    dispose() {
      unsubscribeSource?.();
      unsubscribeSource = undefined;
      listeners.clear();
    }
  });
}

export function createUnavailableSessionSource(message = 'Account service is not connected in this lab build.'): SessionSource {
  return Object.freeze({ read: async () => guestSession(false, message) });
}

const snapshot = state => Object.freeze({
  status: state.status,
  canPrompt: state.status === 'available'
});

const defaultDisplayMode = query => typeof globalThis.matchMedia === 'function' ? globalThis.matchMedia(query) : { matches: false };

export function createPwaInstallService({ eventTarget = globalThis.window, displayMode = defaultDisplayMode } = {}) {
  if (!eventTarget?.addEventListener || !eventTarget?.removeEventListener) throw new Error('PWA install requires an event target.');
  const subscribers = new Set();
  let promptEvent = null;
  let launchedStandalone = false;
  try { launchedStandalone = Boolean(displayMode?.('(display-mode: standalone)')?.matches); } catch {}
  let state = {
    status: launchedStandalone ? 'installed' : 'unavailable'
  };
  let disposed = false;

  const publish = status => {
    state = { status };
    const value = snapshot(state);
    subscribers.forEach(subscriber => subscriber(value));
    return value;
  };
  const beforeInstall = event => {
    if (disposed || typeof event?.prompt !== 'function') return;
    event.preventDefault?.();
    promptEvent = event;
    publish('available');
  };
  const installed = () => {
    promptEvent = null;
    publish('installed');
  };
  eventTarget.addEventListener('beforeinstallprompt', beforeInstall);
  eventTarget.addEventListener('appinstalled', installed);

  return Object.freeze({
    getState() { return snapshot(state); },
    subscribe(subscriber) {
      if (typeof subscriber !== 'function') throw new Error('PWA install subscriber must be a function.');
      subscribers.add(subscriber);
      subscriber(snapshot(state));
      return () => subscribers.delete(subscriber);
    },
    async prompt() {
      if (disposed || !promptEvent || state.status !== 'available') return Object.freeze({ outcome: 'unavailable' });
      const current = promptEvent;
      promptEvent = null;
      publish('prompting');
      try {
        await current.prompt();
        const choice = await current.userChoice;
        const outcome = choice?.outcome === 'accepted' ? 'accepted' : 'dismissed';
        publish(outcome);
        return Object.freeze({ outcome });
      } catch {
        publish('unavailable');
        return Object.freeze({ outcome: 'unavailable' });
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      promptEvent = null;
      subscribers.clear();
      eventTarget.removeEventListener('beforeinstallprompt', beforeInstall);
      eventTarget.removeEventListener('appinstalled', installed);
    }
  });
}

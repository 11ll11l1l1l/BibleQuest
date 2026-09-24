const snapshot = (state, guidance) => Object.freeze({
  status: state.status,
  canPrompt: state.status === 'available',
  guidance: state.status === 'unavailable' ? guidance : null
});

const defaultDisplayMode = query => typeof globalThis.matchMedia === 'function' ? globalThis.matchMedia(query) : { matches: false };
const IOS_DEVICE = /iPad|iPhone|iPod/i;

export function detectPwaInstallGuidance({
  userAgent = globalThis.navigator?.userAgent || '',
  standalone = globalThis.navigator?.standalone === true,
  maxTouchPoints = Number(globalThis.navigator?.maxTouchPoints || 0)
} = {}) {
  if (standalone) return null;
  const ua = String(userAgent);
  const ipadDesktopMode = /Macintosh/i.test(ua) && Number(maxTouchPoints) > 1;
  return IOS_DEVICE.test(ua) || ipadDesktopMode ? 'ios-a2hs' : null;
}

export function createPwaInstallService({
  eventTarget = globalThis.window,
  displayMode = defaultDisplayMode,
  guidance = detectPwaInstallGuidance()
} = {}) {
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
    const value = snapshot(state, guidance);
    subscribers.forEach(subscriber => subscriber(value));
    return value;
  };
  const beforeInstall = event => {
    if (disposed || guidance === 'ios-a2hs' || typeof event?.prompt !== 'function') return;
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
    getState() { return snapshot(state, guidance); },
    subscribe(subscriber) {
      if (typeof subscriber !== 'function') throw new Error('PWA install subscriber must be a function.');
      subscribers.add(subscriber);
      subscriber(snapshot(state, guidance));
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

const defaultLocation = globalThis.location || { href: '', origin: '', pathname: '/' };

function shareUrl(locationRef) {
  const origin = String(locationRef?.origin || '');
  const pathname = String(locationRef?.pathname || '/');
  if (origin) return new URL(pathname || '/', origin).href;
  return String(locationRef?.href || '');
}

function isAbort(error) {
  return error?.name === 'AbortError';
}

export function createWebShareService({
  navigatorRef = globalThis.navigator,
  locationRef = defaultLocation,
} = {}) {
  const url = shareUrl(locationRef);
  const payload = Object.freeze({
    title: 'BibleQuest',
    text: 'Open BibleQuest',
    url,
  });

  async function copyFallback() {
    if (!url || typeof navigatorRef?.clipboard?.writeText !== 'function') {
      return Object.freeze({ outcome: 'unavailable', method: 'none' });
    }
    try {
      await navigatorRef.clipboard.writeText(url);
      return Object.freeze({ outcome: 'copied', method: 'clipboard' });
    } catch {
      return Object.freeze({ outcome: 'unavailable', method: 'none' });
    }
  }

  return Object.freeze({
    payload,
    async share() {
      if (typeof navigatorRef?.share === 'function') {
        try {
          await navigatorRef.share(payload);
          return Object.freeze({ outcome: 'shared', method: 'native' });
        } catch (error) {
          if (isAbort(error)) return Object.freeze({ outcome: 'cancelled', method: 'native' });
          return copyFallback();
        }
      }
      return copyFallback();
    },
  });
}

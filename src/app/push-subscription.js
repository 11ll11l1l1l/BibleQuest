const PUSH_CATEGORIES = Object.freeze(['assignment', 'ministry', 'recognition', 'calendar', 'media']);
const PUSH_CATEGORY_SET = new Set(PUSH_CATEGORIES);
const DEFAULT_OWNER_KEY = 'bq:v5:push-owner';

function normalizeCategories(value) {
  const source = Array.isArray(value) ? value : [];
  return Object.freeze([...new Set(source.map(item => String(item || '').trim()).filter(item => PUSH_CATEGORY_SET.has(item)))]);
}

function decodeApplicationServerKey(value) {
  const raw = String(value || '').trim();
  if (!raw) throw new Error('Push delivery is not configured on this device.');
  const padding = '='.repeat((4 - raw.length % 4) % 4);
  const normalized = (raw + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binary = globalThis.atob ? globalThis.atob(normalized) : Buffer.from(normalized, 'base64').toString('binary');
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function encodeKey(subscription, name) {
  const value = subscription?.getKey?.(name);
  if (!value) return '';
  const bytes = new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const encoded = globalThis.btoa ? globalThis.btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function serializeSubscription(subscription, userId, categories) {
  const endpoint = String(subscription?.endpoint || '').trim();
  const p256dh = encodeKey(subscription, 'p256dh');
  const auth = encodeKey(subscription, 'auth');
  if (!endpoint || !p256dh || !auth) throw new Error('Browser push subscription is incomplete.');
  return Object.freeze({
    user_id: userId,
    endpoint,
    p256dh,
    auth,
    enabled_categories: [...categories]
  });
}

function currentUserId(session) {
  const state = session?.getState?.();
  return state?.authenticated === true && state?.user?.id ? String(state.user.id) : '';
}

export function createPushSubscriptionService({
  session,
  repository,
  serviceWorker = globalThis.navigator?.serviceWorker,
  notification = globalThis.Notification,
  applicationServerKey = '',
  ownerStorage = globalThis.localStorage,
  ownerKey = DEFAULT_OWNER_KEY
} = {}) {
  if (!session?.getState || !session?.beforeSignOut) throw new Error('Push subscription service requires session lifecycle support.');
  if (!repository?.upsert || !repository?.removeByEndpoint) throw new Error('Push subscription service requires subscription persistence.');

  let disposed = false;
  let operation = Promise.resolve();

  const readOwner = () => {
    try { return String(ownerStorage?.getItem?.(ownerKey) || ''); } catch { return ''; }
  };
  const writeOwner = userId => {
    try {
      if (userId) ownerStorage?.setItem?.(ownerKey, userId);
      else ownerStorage?.removeItem?.(ownerKey);
    } catch {}
  };
  const registration = async () => {
    if (!serviceWorker?.ready) throw new Error('Service workers are not available on this device.');
    const ready = await serviceWorker.ready;
    if (!ready?.pushManager) throw new Error('Web Push is not available on this device.');
    return ready;
  };
  const withOperation = task => {
    const next = operation.then(task, task);
    operation = next.catch(() => {});
    return next;
  };
  const dropBrowserSubscription = async subscription => {
    if (!subscription) return false;
    try { return await subscription.unsubscribe(); } catch { return false; }
  };

  async function cleanup({ removeRemote = true } = {}) {
    const ready = await registration().catch(() => null);
    const subscription = ready ? await ready.pushManager.getSubscription().catch(() => null) : null;
    const endpoint = String(subscription?.endpoint || '').trim();
    if (removeRemote && endpoint) {
      try { await repository.removeByEndpoint(endpoint); } catch {}
    }
    await dropBrowserSubscription(subscription);
    writeOwner('');
    return Object.freeze({ enabled: false, categories: Object.freeze([]) });
  }

  const detachBeforeSignOut = session.beforeSignOut(() => withOperation(() => cleanup({ removeRemote: true })));

  return Object.freeze({
    categories: PUSH_CATEGORIES,
    async getState() {
      if (disposed) return Object.freeze({ supported: false, enabled: false, categories: Object.freeze([]), permission: 'default' });
      const permission = String(notification?.permission || 'default');
      const ready = await registration().catch(() => null);
      const subscription = ready ? await ready.pushManager.getSubscription().catch(() => null) : null;
      const owner = readOwner();
      const userId = currentUserId(session);
      return Object.freeze({
        supported: Boolean(ready && notification && typeof notification.requestPermission === 'function'),
        enabled: Boolean(subscription && owner && userId && owner === userId),
        categories: Object.freeze([]),
        permission
      });
    },
    async enable(requestedCategories) {
      return withOperation(async () => {
        if (disposed) throw new Error('Push subscription service is disposed.');
        const userId = currentUserId(session);
        if (!userId) throw new Error('Sign in before enabling push notifications.');
        const categories = normalizeCategories(requestedCategories);
        if (!categories.length) throw new Error('Choose at least one push notification category.');
        if (!notification || typeof notification.requestPermission !== 'function') throw new Error('Web Push is not supported by this browser.');

        let permission = String(notification.permission || 'default');
        if (permission === 'default') permission = await notification.requestPermission();
        if (permission !== 'granted') throw new Error('Notification permission was not granted.');

        const ready = await registration();
        let subscription = await ready.pushManager.getSubscription();
        const previousOwner = readOwner();
        if (subscription && previousOwner !== userId) {
          await dropBrowserSubscription(subscription);
          subscription = null;
          writeOwner('');
        }
        if (!subscription) {
          subscription = await ready.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: decodeApplicationServerKey(applicationServerKey)
          });
        }

        const row = serializeSubscription(subscription, userId, categories);
        try {
          await repository.upsert(row);
        } catch (error) {
          await dropBrowserSubscription(subscription);
          writeOwner('');
          throw error;
        }
        writeOwner(userId);
        return Object.freeze({ enabled: true, categories, endpoint: row.endpoint });
      });
    },
    async disable() {
      return withOperation(() => cleanup({ removeRemote: true }));
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      detachBeforeSignOut?.();
    }
  });
}

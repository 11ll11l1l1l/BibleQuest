const PUSH_CATEGORIES = Object.freeze(['assignment', 'ministry', 'recognition', 'calendar', 'media']);
const PUSH_CATEGORY_SET = new Set(PUSH_CATEGORIES);
const DEFAULT_OWNER_KEY = 'bq:v5:push-owner';

const clean = value => String(value ?? '').trim();
function normalizeCategories(value) {
  return Object.freeze([...new Set((Array.isArray(value) ? value : []).map(item => clean(item).toLowerCase()).filter(item => PUSH_CATEGORY_SET.has(item)))]);
}
function decodeApplicationServerKey(value) {
  const raw = clean(value);
  if (!raw) throw new Error('Push delivery is not configured on this device.');
  const padding = '='.repeat((4 - raw.length % 4) % 4);
  const normalized = (raw + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binary = globalThis.atob ? globalThis.atob(normalized) : Buffer.from(normalized, 'base64').toString('binary');
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}
function currentUserId(session) {
  const state = session?.getState?.();
  return state?.authenticated === true && state?.user?.id ? clean(state.user.id) : '';
}

export function createPushSubscriptionService({
  session,
  persistence,
  serviceWorker = globalThis.navigator?.serviceWorker,
  notification = globalThis.Notification,
  applicationServerKey = '',
  ownerStorage,
  ownerKey = DEFAULT_OWNER_KEY,
} = {}) {
  if (!session?.getState || !session?.beforeSignOut) throw new Error('Push subscription service requires session lifecycle support.');
  if (!persistence?.save || !persistence?.remove) throw new Error('Push subscription service requires account-safe persistence.');
  if (!ownerStorage?.getItem || !ownerStorage?.setItem || !ownerStorage?.removeItem) throw new Error('Push subscription service requires an explicit owner-storage boundary (e.g. the shared authStorage owner) - it must never default to raw browser storage.');
  let disposed = false;
  let operation = Promise.resolve();
  const readOwner = () => { try { return clean(ownerStorage?.getItem?.(ownerKey)); } catch { return ''; } };
  const writeOwner = userId => { try { userId ? ownerStorage?.setItem?.(ownerKey, userId) : ownerStorage?.removeItem?.(ownerKey); } catch {} };
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
  async function cleanup() {
    const ready = await registration().catch(() => null);
    const subscription = ready ? await ready.pushManager.getSubscription().catch(() => null) : null;
    if (subscription) {
      try { await persistence.remove(subscription); } catch {}
      await dropBrowserSubscription(subscription);
    }
    writeOwner('');
    return Object.freeze({ enabled: false, categories: Object.freeze([]) });
  }
  const detachBeforeSignOut = session.beforeSignOut(() => withOperation(cleanup));

  return Object.freeze({
    categories: PUSH_CATEGORIES,
    async getState() {
      const permission = clean(notification?.permission) || 'default';
      if (disposed) return Object.freeze({ supported: false, enabled: false, categories: Object.freeze([]), permission });
      const ready = await registration().catch(() => null);
      const subscription = ready ? await ready.pushManager.getSubscription().catch(() => null) : null;
      const userId = currentUserId(session);
      return Object.freeze({ supported: Boolean(ready && notification && typeof notification.requestPermission === 'function'), enabled: Boolean(subscription && userId && readOwner() === userId), categories: Object.freeze([]), permission });
    },
    async enable(requestedCategories) {
      return withOperation(async () => {
        if (disposed) throw new Error('Push subscription service is disposed.');
        const userId = currentUserId(session);
        if (!userId) throw new Error('Sign in before enabling push notifications.');
        const categories = normalizeCategories(requestedCategories);
        if (!categories.length) throw new Error('Choose at least one push notification category.');
        if (!notification || typeof notification.requestPermission !== 'function') throw new Error('Web Push is not supported by this browser.');
        let permission = clean(notification.permission) || 'default';
        if (permission === 'default') permission = await notification.requestPermission();
        if (permission !== 'granted') throw new Error('Notification permission was not granted.');
        const ready = await registration();
        let subscription = await ready.pushManager.getSubscription();
        if (subscription && readOwner() !== userId) {
          await dropBrowserSubscription(subscription);
          subscription = null;
          writeOwner('');
        }
        if (!subscription) subscription = await ready.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeApplicationServerKey(applicationServerKey) });
        try { await persistence.save(subscription, categories); }
        catch (error) { await dropBrowserSubscription(subscription); writeOwner(''); throw error; }
        writeOwner(userId);
        return Object.freeze({ enabled: true, categories, endpoint: clean(subscription.endpoint) });
      });
    },
    async disable() { return withOperation(cleanup); },
    dispose() { if (!disposed) { disposed = true; detachBeforeSignOut?.(); } },
  });
}

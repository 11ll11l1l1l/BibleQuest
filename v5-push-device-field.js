import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm';
import { createStore } from './src/app/store.js';
import { createSessionService } from './src/app/session.js';
import { createPushSubscriptionService } from './src/app/push-subscription.js';
import { createPushSubscriptionPersistence } from './src/app/push-subscription-persistence.js';
import { createPushSubscriptionRepository } from './src/app/push-subscription-repository.js';
import { authStorage } from './src/core/storage.js';

const SUPABASE_URL = 'https://zkfmgezvzugchcwppreq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_mJyieT7WZT1vAZX7XFdsrg_lRgDxcsq';
const VAPID_PUBLIC_KEY = 'BKxJ2WXSqmiA9ZEmx8bItafM4fp_R4NkTC4F45BGZjjDqnfK-C3Goqb25CVgWsSSwMZsvOczx8LNv2vstkdqRmI';
const OWNER_KEY = 'bq:v5:push-owner';
const ALLOWED_HOST_SUFFIXES = Object.freeze(['mybiblequest.pages.dev', 'biblequest-7th.pages.dev']);

const $ = selector => document.querySelector(selector);
const fields = Object.freeze({
  harness: $('[data-field-harness]'),
  auth: $('[data-field-auth]'),
  supported: $('[data-field-supported]'),
  permission: $('[data-field-permission]'),
  browserSubscription: $('[data-field-browser-sub]'),
  persisted: $('[data-field-persisted]'),
  assignment: $('[data-field-assignment]'),
  owner: $('[data-field-owner]'),
  message: $('[data-field-message]'),
});

function isAllowedFieldOrigin() {
  if (location.protocol !== 'https:') return false;
  const host = location.hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some(suffix => host === suffix || host.endsWith(`.${suffix}`));
}

function safeMessage(value) {
  return String(value || 'Operation failed.')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted-email]')
    .replace(/https:\/\/[^\s"'<>]+/gi, '[redacted-url]')
    .replace(/\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/g, '[redacted-token]')
    .slice(0, 280);
}

function setMessage(message, kind = '') {
  fields.message.textContent = message;
  fields.message.dataset.kind = kind;
}

function setStatus(node, value, ok = null) {
  node.textContent = value;
  node.dataset.kind = ok === true ? 'ok' : ok === false ? 'error' : '';
}

if (!isAllowedFieldOrigin()) {
  setStatus(fields.harness, 'blocked: exact Cloudflare preview/production host required', false);
  throw new Error('V5 push field harness runs only on an approved HTTPS BibleQuest host.');
}

const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: authStorage,
  },
});

const auth = Object.freeze({
  enabled: () => true,
  async getSession() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return { session: data.session ?? null };
  },
  async getUser() {
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    return { user: data.user ?? null };
  },
  async signIn(email, password) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { session: data.session ?? null, user: data.user ?? null };
  },
  async signOut() {
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) throw error;
  },
  async subscribe(listener) {
    const { data } = client.auth.onAuthStateChange((event, session) => listener(event, session));
    return () => data.subscription.unsubscribe();
  },
});

const store = createStore({
  session: Object.freeze({
    status: 'booting',
    authenticated: false,
    remoteAvailable: true,
    user: null,
    expiresAt: null,
    error: '',
  }),
});
const session = createSessionService({ auth, store });

const repository = createPushSubscriptionRepository({
  from: table => client.from(table),
});
const persistence = createPushSubscriptionPersistence({
  session,
  api: Object.freeze({
    upsert: row => repository.upsert({
      user_id: row.user_id,
      endpoint: row.endpoint,
      p256dh: row.p256dh,
      auth: row.auth,
      enabled_categories: Array.isArray(row.categories) ? row.categories : [],
    }),
    remove: async (_userId, endpoint) => repository.removeByEndpoint(endpoint),
  }),
});

let serviceWorkerRegistration = null;
if ('serviceWorker' in navigator) {
  serviceWorkerRegistration = await navigator.serviceWorker.register('/offline-shell-sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;
}

const push = createPushSubscriptionService({
  session,
  persistence,
  serviceWorker: navigator.serviceWorker,
  notification: globalThis.Notification,
  applicationServerKey: VAPID_PUBLIC_KEY,
  ownerStorage: authStorage,
  ownerKey: OWNER_KEY,
});

async function currentBrowserSubscription() {
  if (!serviceWorkerRegistration?.pushManager) return null;
  return serviceWorkerRegistration.pushManager.getSubscription().catch(() => null);
}

async function ownRows() {
  const state = session.getState();
  if (!state.authenticated || !state.user?.id) return [];
  const { data, error } = await client
    .from('bible_push_subscriptions')
    .select('id,user_id,endpoint,enabled_categories,updated_at')
    .eq('user_id', state.user.id)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function sanitizedSnapshot() {
  const state = session.getState();
  const browserSubscription = await currentBrowserSubscription();
  const rows = state.authenticated ? await ownRows() : [];
  const currentRow = browserSubscription
    ? rows.find(row => String(row.endpoint || '') === String(browserSubscription.endpoint || ''))
    : null;
  const ownerMatches = Boolean(
    state.authenticated
    && state.user?.id
    && authStorage.getItem(OWNER_KEY) === String(state.user.id),
  );
  return Object.freeze({
    observed_at: new Date().toISOString(),
    origin: location.origin,
    authenticated: state.authenticated === true,
    push_supported: Boolean(
      'serviceWorker' in navigator
      && globalThis.PushManager
      && globalThis.Notification
      && serviceWorkerRegistration?.pushManager
    ),
    notification_permission: globalThis.Notification?.permission || 'unsupported',
    browser_subscription_present: Boolean(browserSubscription),
    current_browser_row_present: Boolean(currentRow),
    account_push_row_count: rows.length,
    assignment_category_enabled_for_current_browser: Boolean(
      currentRow?.enabled_categories?.includes?.('assignment')
    ),
    owner_marker_matches_current_account: ownerMatches,
  });
}

async function refresh() {
  try {
    const state = session.getState();
    const snapshot = await sanitizedSnapshot();
    setStatus(fields.harness, 'ready', true);
    setStatus(fields.auth, snapshot.authenticated ? 'yes' : 'no', snapshot.authenticated);
    setStatus(fields.supported, snapshot.push_supported ? 'yes' : 'no', snapshot.push_supported);
    setStatus(fields.permission, snapshot.notification_permission, snapshot.notification_permission === 'granted' ? true : snapshot.notification_permission === 'denied' ? false : null);
    setStatus(fields.browserSubscription, snapshot.browser_subscription_present ? 'present' : 'absent', snapshot.browser_subscription_present ? true : null);
    setStatus(fields.persisted, snapshot.current_browser_row_present ? `current browser present; account total ${snapshot.account_push_row_count}` : `current browser absent; account total ${snapshot.account_push_row_count}`, snapshot.current_browser_row_present ? true : null);
    setStatus(fields.assignment, snapshot.assignment_category_enabled_for_current_browser ? 'enabled' : 'not enabled', snapshot.assignment_category_enabled_for_current_browser ? true : null);
    setStatus(fields.owner, snapshot.owner_marker_matches_current_account ? 'matches signed-in account' : 'not matched', snapshot.owner_marker_matches_current_account ? true : null);
    $('[data-field-enable]').disabled = !state.authenticated || !snapshot.push_supported;
    $('[data-field-disable]').disabled = !state.authenticated || !snapshot.push_supported;
    $('[data-field-signout]').disabled = !state.authenticated;
    return snapshot;
  } catch (error) {
    setMessage(safeMessage(error?.message || error), 'error');
    throw error;
  }
}

$('[data-field-signin]').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const email = String(data.get('email') || '').trim();
  const password = String(data.get('password') || '');
  setMessage('Signing in…');
  try {
    await session.signIn(email, password);
    form.elements.password.value = '';
    setMessage('Signed in. Credentials were not written to field evidence.', 'ok');
    await refresh();
  } catch (error) {
    form.elements.password.value = '';
    setMessage(safeMessage(error?.message || error), 'error');
  }
});

$('[data-field-signout]').addEventListener('click', async () => {
  setMessage('Signing out and cleaning the current browser push subscription…');
  try {
    await session.signOut();
    setMessage('Signed out. Current-browser push cleanup completed through the V5 lifecycle.', 'ok');
    await refresh();
  } catch (error) {
    setMessage(safeMessage(error?.message || error), 'error');
  }
});

$('[data-field-enable]').addEventListener('click', async () => {
  setMessage('Requesting notification permission and enabling assignment push…');
  try {
    await push.enable(['assignment']);
    const snapshot = await refresh();
    if (!snapshot.browser_subscription_present || !snapshot.current_browser_row_present || !snapshot.assignment_category_enabled_for_current_browser) {
      throw new Error('Push enable did not reach the required persisted field-test state.');
    }
    setMessage('Assignment push is enabled for this browser. The field tester may now fully close the app for Gate 1.', 'ok');
  } catch (error) {
    setMessage(safeMessage(error?.message || error), 'error');
  }
});

$('[data-field-disable]').addEventListener('click', async () => {
  setMessage('Disabling push and removing the current browser subscription…');
  try {
    await push.disable();
    const snapshot = await refresh();
    if (snapshot.browser_subscription_present || snapshot.current_browser_row_present) {
      throw new Error('Push disable did not remove the current browser subscription cleanly.');
    }
    setMessage('Push is disabled for this browser. Gate 2 may now run with the app fully closed.', 'ok');
  } catch (error) {
    setMessage(safeMessage(error?.message || error), 'error');
  }
});

$('[data-field-refresh]').addEventListener('click', () => {
  setMessage('Refreshing sanitized state…');
  void refresh().then(() => setMessage('Sanitized state refreshed.', 'ok')).catch(() => {});
});

$('[data-field-copy]').addEventListener('click', async () => {
  try {
    const snapshot = await sanitizedSnapshot();
    await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
    setMessage('Sanitized status copied. It contains no email, user ID, push endpoint, or token.', 'ok');
  } catch (error) {
    setMessage(safeMessage(error?.message || error), 'error');
  }
});

window.addEventListener('pageshow', () => {
  void refresh().catch(() => {});
});

await session.boot();
await refresh();
setMessage('Harness ready. Use a designated safe test account only.', 'ok');

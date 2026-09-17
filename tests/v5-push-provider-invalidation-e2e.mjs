import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import { firefox } from 'playwright';

const env = process.env;
for (const key of ['BQ_LOCAL_SUPABASE_URL', 'BQ_LOCAL_ANON_KEY', 'BQ_LOCAL_SERVICE_ROLE_KEY']) {
  assert.ok(env[key], `Missing local-stack environment variable: ${key}`);
}
const baseUrl = new URL(env.BQ_LOCAL_SUPABASE_URL);
assert.ok(['127.0.0.1', 'localhost'].includes(baseUrl.hostname), 'Provider E2E refuses non-loopback Supabase URLs');
const apiBase = baseUrl.origin.replace(/\/$/, '');
const anonKey = env.BQ_LOCAL_ANON_KEY;
const serviceKey = env.BQ_LOCAL_SERVICE_ROLE_KEY;
const vapidPublicKey = fs.readFileSync('/tmp/bq-vapid-public', 'utf8').trim();
assert.ok(vapidPublicKey.length > 40, 'Disposable VAPID public key is missing');

const serviceHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
};
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
  return { response, body };
}

async function createUser() {
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const email = `push-${suffix}@bq-local.invalid`;
  const password = `Push-${crypto.randomUUID()}!Aa1`;
  const created = await jsonFetch(`${apiBase}/auth/v1/admin/users`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  assert.equal(created.response.ok, true, `Local Auth user creation failed (${created.response.status})`);
  assert.ok(created.body?.id, 'Local Auth user creation returned no user id');

  const signed = await jsonFetch(`${apiBase}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(signed.response.ok, true, `Local Auth sign-in failed (${signed.response.status})`);
  assert.ok(signed.body?.access_token, 'Local Auth sign-in returned no access token');
  return { id: created.body.id, accessToken: signed.body.access_token };
}

async function insertSubscription(user, subscription) {
  const keys = subscription?.keys || {};
  assert.ok(subscription?.endpoint && keys.p256dh && keys.auth, 'Browser returned incomplete PushSubscription JSON');
  const inserted = await jsonFetch(`${apiBase}/rest/v1/bible_push_subscriptions`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${user.accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      enabled_categories: ['assignment'],
    }),
  });
  assert.equal(inserted.response.ok, true, `Push subscription persistence failed (${inserted.response.status})`);
  assert.equal(Array.isArray(inserted.body), true);
  assert.ok(inserted.body[0]?.id, 'Push subscription insert returned no id');
  return inserted.body[0].id;
}

async function createNotification(userId, sequence) {
  const inserted = await jsonFetch(`${apiBase}/rest/v1/bible_notifications`, {
    method: 'POST',
    headers: { ...serviceHeaders, Prefer: 'return=representation' },
    body: JSON.stringify({
      user_id: userId,
      notification_type: 'assignment',
      title: 'BibleQuest provider E2E',
      body: `Disposable provider check ${sequence}`,
      action_kind: 'assignment',
    }),
  });
  assert.equal(inserted.response.ok, true, `Notification fixture insert failed (${inserted.response.status})`);
  assert.ok(inserted.body?.[0]?.id, 'Notification fixture insert returned no id');
  return inserted.body[0].id;
}

async function deliver(notificationId) {
  const sent = await jsonFetch(`${apiBase}/functions/v1/bq-push-delivery`, {
    method: 'POST',
    headers: { ...serviceHeaders },
    body: JSON.stringify({ notificationId }),
  });
  assert.equal(sent.response.status, 200, `Push sender returned HTTP ${sent.response.status}`);
  return sent.body || {};
}

async function ownSubscriptionCount(user, subscriptionId) {
  const params = new URLSearchParams({ select: 'id', id: `eq.${subscriptionId}` });
  const result = await jsonFetch(`${apiBase}/rest/v1/bible_push_subscriptions?${params}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${user.accessToken}` },
  });
  assert.equal(result.response.ok, true, `Subscription verification failed (${result.response.status})`);
  return Array.isArray(result.body) ? result.body.length : -1;
}

function startWebOrigin() {
  const html = `<!doctype html><meta charset="utf-8"><title>BQ Push Provider E2E</title>
    <button id="subscribe" type="button">Subscribe</button>
    <script>
      const decode = value => {
        const padding = '='.repeat((4 - value.length % 4) % 4);
        const raw = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'));
        return Uint8Array.from(raw, c => c.charCodeAt(0));
      };
      window.__configureVapid = value => { window.__vapid = value; };
      document.querySelector('#subscribe').addEventListener('click', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          await navigator.serviceWorker.ready;
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') throw new Error('notification permission=' + permission);
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: decode(window.__vapid),
          });
          window.__subscription = subscription.toJSON();
        } catch (error) {
          window.__subscriptionError = String(error?.stack || error);
        }
      });
    </script>`;
  const sw = `self.addEventListener('push', event => {
    let data = {};
    try { data = event.data ? event.data.json() : {}; } catch {}
    event.waitUntil(self.registration.showNotification(data.title || 'BibleQuest', {
      body: data.body || '',
      data: { url: data.url || '/#/' },
    }));
  });`;
  const server = http.createServer((req, res) => {
    if (req.url === '/sw.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript', 'Service-Worker-Allowed': '/', 'Cache-Control': 'no-store' });
      res.end(sw);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(html);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(4173, '127.0.0.1', () => resolve(server));
  });
}

let user = null;
let browser = null;
let webServer = null;
try {
  user = await createUser();
  webServer = await startWebOrigin();

  browser = await firefox.launch({
    headless: true,
    firefoxUserPrefs: {
      'dom.push.enabled': true,
      'dom.push.connection.enabled': true,
      'dom.webnotifications.enabled': true,
      'dom.webnotifications.requireuserinteraction': false,
    },
  });
  const context = await browser.newContext();
  await context.grantPermissions(['notifications'], { origin: 'http://127.0.0.1:4173' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(key => window.__configureVapid(key), vapidPublicKey);
  await page.locator('#subscribe').click();
  await page.waitForFunction(() => window.__subscription || window.__subscriptionError, null, { timeout: 30000 });
  const subscriptionState = await page.evaluate(() => ({
    subscription: window.__subscription || null,
    error: window.__subscriptionError || '',
  }));
  assert.equal(subscriptionState.error, '', `Firefox PushManager subscription failed: ${subscriptionState.error}`);
  const subscription = subscriptionState.subscription;
  const endpointUrl = new URL(subscription.endpoint);
  assert.equal(endpointUrl.protocol, 'https:', 'Real browser push endpoint must be HTTPS');
  assert.notEqual(endpointUrl.hostname, '127.0.0.1', 'Push subscription did not use an external browser push provider');
  assert.notEqual(endpointUrl.hostname, 'localhost', 'Push subscription did not use an external browser push provider');

  const subscriptionId = await insertSubscription(user, subscription);

  const firstNotification = await createNotification(user.id, 1);
  const firstDelivery = await deliver(firstNotification);
  assert.equal(firstDelivery.attempted, 1, 'First provider send must attempt exactly one subscription');
  assert.equal(firstDelivery.delivered, 1, 'Real browser push provider must accept the first send');
  assert.equal(firstDelivery.removed, 0, 'Fresh subscription must not be removed');
  assert.equal(firstDelivery.failed, 0, 'Fresh provider send must not fail');

  const unsubscribed = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const current = await registration.pushManager.getSubscription();
    return current ? current.unsubscribe() : false;
  });
  assert.equal(unsubscribed, true, 'Firefox did not unregister the controlled push subscription');

  let cleanupObserved = false;
  let last = null;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    await delay(attempt === 1 ? 3000 : 5000);
    const notificationId = await createNotification(user.id, attempt + 1);
    last = await deliver(notificationId);
    if (last.removed === 1) {
      cleanupObserved = true;
      break;
    }
  }

  assert.equal(cleanupObserved, true, `Browser push provider never returned terminal invalidation; last result=${JSON.stringify(last)}`);
  assert.equal(last.attempted, 1, 'Invalidation send must target exactly one persisted subscription');
  assert.equal(last.delivered, 0, 'Invalidated provider endpoint must not count as delivered');
  assert.equal(last.removed, 1, 'Sender must remove exactly the invalidated subscription');
  assert.equal(last.failed, 0, 'Terminal invalidation cleanup must not be classified as a sender failure');
  assert.equal(await ownSubscriptionCount(user, subscriptionId), 0, 'Invalidated browser subscription row still exists after provider cleanup');

  console.log('PASS: genuine browser push-provider invalidation removed exactly one persisted subscription.');
} finally {
  if (browser) await browser.close().catch(() => {});
  if (webServer) await new Promise(resolve => webServer.close(resolve));
  if (user?.id) {
    await jsonFetch(`${apiBase}/auth/v1/admin/users/${user.id}`, { method: 'DELETE', headers: serviceHeaders }).catch(() => {});
  }
}

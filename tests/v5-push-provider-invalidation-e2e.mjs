import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const env = process.env;
for (const key of ['BQ_LOCAL_SUPABASE_URL', 'BQ_LOCAL_ANON_KEY', 'BQ_LOCAL_SERVICE_ROLE_KEY']) {
  assert.ok(env[key], `Missing local-stack environment variable: ${key}`);
}

const baseUrl = new URL(env.BQ_LOCAL_SUPABASE_URL);
assert.ok(['127.0.0.1', 'localhost'].includes(baseUrl.hostname), 'Provider E2E refuses non-loopback Supabase URLs');
const apiBase = baseUrl.origin.replace(/\/$/, '');
const anonKey = env.BQ_LOCAL_ANON_KEY;
const serviceKey = env.BQ_LOCAL_SERVICE_ROLE_KEY;
const serviceHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
};

const toBase64Url = value => Buffer.from(value)
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/g, '');

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

function makeRealProviderDeadSubscription() {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  const p256dh = toBase64Url(ecdh.getPublicKey(undefined, 'uncompressed'));
  const auth = toBase64Url(crypto.randomBytes(16));

  // Mozilla Autopush documents /wpush/... as its Web Push send endpoint and
  // returns HTTP 404 for invalid endpoint URLs and HTTP 410 for expired/
  // no-longer-valid subscriptions. The randomized opaque token below cannot
  // belong to a real user, but the POST is handled by the genuine browser
  // push provider rather than a BibleQuest-controlled simulator.
  const deadToken = toBase64Url(crypto.randomBytes(96));
  const endpoint = `https://updates.push.services.mozilla.com/wpush/v2/${deadToken}`;
  return { endpoint, p256dh, auth };
}

async function insertSubscription(user, subscription) {
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
      p256dh: subscription.p256dh,
      auth: subscription.auth,
      enabled_categories: ['assignment'],
    }),
  });
  assert.equal(inserted.response.ok, true, `Push subscription persistence failed (${inserted.response.status})`);
  assert.equal(Array.isArray(inserted.body), true);
  assert.ok(inserted.body[0]?.id, 'Push subscription insert returned no id');
  return inserted.body[0].id;
}

async function createNotification(userId) {
  const inserted = await jsonFetch(`${apiBase}/rest/v1/bible_notifications`, {
    method: 'POST',
    headers: { ...serviceHeaders, Prefer: 'return=representation' },
    body: JSON.stringify({
      user_id: userId,
      notification_type: 'assignment',
      title: 'BibleQuest provider invalidation E2E',
      body: 'Disposable genuine-provider cleanup proof',
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

async function ownOtherSubscriptionCount(user, subscriptionId) {
  const params = new URLSearchParams({ select: 'id', id: `eq.${subscriptionId}` });
  const result = await jsonFetch(`${apiBase}/rest/v1/bible_push_subscriptions?${params}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${user.accessToken}` },
  });
  assert.equal(result.response.ok, true, `Control subscription verification failed (${result.response.status})`);
  return Array.isArray(result.body) ? result.body.length : -1;
}

let user = null;
try {
  user = await createUser();

  const deadSubscription = makeRealProviderDeadSubscription();
  const deadSubscriptionId = await insertSubscription(user, deadSubscription);

  // A control row in a different category must not be selected or removed.
  const control = makeRealProviderDeadSubscription();
  const controlInsert = await jsonFetch(`${apiBase}/rest/v1/bible_push_subscriptions`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${user.accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      user_id: user.id,
      endpoint: control.endpoint,
      p256dh: control.p256dh,
      auth: control.auth,
      enabled_categories: ['calendar'],
    }),
  });
  assert.equal(controlInsert.response.ok, true, `Control subscription persistence failed (${controlInsert.response.status})`);
  const controlSubscriptionId = controlInsert.body?.[0]?.id;
  assert.ok(controlSubscriptionId, 'Control subscription insert returned no id');

  const notificationId = await createNotification(user.id);
  const delivery = await deliver(notificationId);

  assert.equal(delivery.attempted, 1, 'Provider invalidation send must target exactly the matching-category subscription');
  assert.equal(delivery.delivered, 0, 'Invalid provider endpoint must not count as delivered');
  assert.equal(delivery.removed, 1, 'Real provider 404/410 must remove exactly the invalid subscription');
  assert.equal(delivery.failed, 0, 'Terminal provider invalidation cleanup must not be classified as a sender failure');
  assert.equal(delivery.skipped, 0, 'Fresh provider invalidation proof must not be idempotency-skipped');

  assert.equal(await ownSubscriptionCount(user, deadSubscriptionId), 0, 'Invalid provider subscription row still exists after cleanup');
  assert.equal(await ownOtherSubscriptionCount(user, controlSubscriptionId), 1, 'Unrelated control subscription was removed');

  console.log('PASS: genuine Mozilla Autopush invalid-endpoint response removed exactly one matching persisted subscription.');
} finally {
  if (user?.id) {
    await jsonFetch(`${apiBase}/auth/v1/admin/users/${user.id}`, {
      method: 'DELETE',
      headers: serviceHeaders,
    }).catch(() => {});
  }
}

import assert from 'node:assert/strict';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = await readFile(new URL('../src/app/push-subscription.js', import.meta.url), 'utf8');
const tempModule = join(tmpdir(), `bq-push-subscription-${process.pid}-${Date.now()}.mjs`);
await writeFile(tempModule, source, 'utf8');
const { createPushSubscriptionService } = await import(`${pathToFileURL(tempModule).href}?v=${Date.now()}`);
await rm(tempModule, { force: true });

const subscription = endpoint => ({ endpoint, unsubscribed: 0, toJSON() { return { endpoint, keys: { p256dh: 'p256dh', auth: 'auth' } }; }, async unsubscribe() { this.unsubscribed += 1; return true; } });
function harness({ owner = '', permission = 'granted', persistError = null } = {}) {
  let current = owner ? subscription('https://push.example.test/stale') : null;
  const created = [], saved = [], removed = [];
  let beforeSignOut = null;
  const storage = new Map(owner ? [['push-owner', owner]] : []);
  const ownerStorage = {
    read(key, fallback = null) { return storage.has(key) ? storage.get(key) : fallback; },
    write(key, value) { storage.set(key, String(value)); return value; },
    remove(key) { storage.delete(key); },
  };
  const session = { getState: () => ({ authenticated: true, user: { id: 'user-a' } }), beforeSignOut(listener) { beforeSignOut = listener; return () => { beforeSignOut = null; }; } };
  const pushManager = { async getSubscription() { return current; }, async subscribe(options) { assert.equal(options.userVisibleOnly, true); assert.ok(options.applicationServerKey instanceof Uint8Array); current = subscription(`https://push.example.test/new-${created.length + 1}`); created.push(current); return current; } };
  const persistence = { async save(value, categories) { if (persistError) throw persistError; saved.push({ value, categories }); return { user_id: 'user-a', endpoint: value.endpoint }; }, async remove(value) { removed.push(value.endpoint); } };
  const notification = { permission, async requestPermission() { return permission; } };
  const service = createPushSubscriptionService({ session, persistence, serviceWorker: { ready: Promise.resolve({ pushManager }) }, notification, applicationServerKey: 'AQIDBA', ownerStorage });
  return { service, storage, created, saved, removed, get current() { return current; }, get beforeSignOut() { return beforeSignOut; } };
}

{
  const h = harness({ owner: 'user-old' });
  const stale = h.current;
  const result = await h.service.enable(['assignment', 'invalid', 'assignment']);
  assert.equal(stale.unsubscribed, 1, 'old-account browser subscription must be retired');
  assert.equal(h.created.length, 1, 'owner rotation must create a fresh browser endpoint');
  assert.deepEqual(result.categories, ['assignment']);
  assert.equal(h.saved.length, 1);
  assert.deepEqual(h.saved[0].categories, ['assignment'], 'lifecycle must delegate normalized categories to integrated persistence');
  assert.equal(h.saved[0].value, h.current, 'native PushSubscription must be passed to persistence owner');
  assert.equal(h.storage.get('push-owner'), 'user-a');
  await h.beforeSignOut();
  assert.deepEqual(h.removed, [h.current.endpoint], 'sign-out must remove the exact owned endpoint through persistence');
  assert.equal(h.current.unsubscribed, 1, 'sign-out must unsubscribe the browser endpoint');
  assert.equal(h.storage.has('push-owner'), false, 'sign-out must clear local account ownership');
}
{
  const h = harness({ permission: 'denied' });
  await assert.rejects(() => h.service.enable(['assignment']), /permission was not granted/i);
  assert.equal(h.created.length, 0); assert.equal(h.saved.length, 0);
}
{
  const h = harness({ persistError: new Error('backend unavailable') });
  await assert.rejects(() => h.service.enable(['media']), /backend unavailable/);
  assert.equal(h.created[0].unsubscribed, 1, 'failed persistence must not leave an unowned live browser subscription');
  assert.equal(h.storage.has('push-owner'), false);
}
{
  const h = harness();
  await assert.rejects(() => h.service.enable([]), /at least one/i, 'push must default off until a category is explicitly selected');
}
{
  const session = { getState: () => ({ authenticated: true, user: { id: 'user-a' } }), beforeSignOut() { return () => {}; } };
  const persistence = { async save() {}, async remove() {} };
  assert.throws(() => createPushSubscriptionService({ session, persistence }), /shared storage boundary/i, 'push lifecycle must fail closed without the shared storage owner');
}
const workerSource = await readFile(new URL('../offline-shell-sw.js', import.meta.url), 'utf8');
assert.match(workerSource, /addEventListener\('push'/);
assert.match(workerSource, /addEventListener\('notificationclick'/);
assert.match(workerSource, /url\.origin===self\.location\.origin/);
assert.doesNotMatch(workerSource, /backgroundsync|periodicsync/i);
const persistenceSource = await readFile(new URL('../src/app/push-subscription-persistence.js', import.meta.url), 'utf8');
assert.match(persistenceSource, /requireAccount\(session\)/, 'integrated persistence must remain account-scoped');
assert.match(source, /persistence\.save\(subscription, categories\)/, 'lifecycle must consume integrated persistence rather than duplicate backend writes');
assert.doesNotMatch(source, /\.upsert\(/, 'lifecycle must not duplicate persistence API ownership');
assert.doesNotMatch(source, /\b(?:localStorage|sessionStorage)\b/, 'push lifecycle must not bypass the shared storage owner for its local account marker');
console.log('PASS v5 push subscription lifecycle + persistence integration');
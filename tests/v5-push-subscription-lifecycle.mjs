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

const makeKey = length => Uint8Array.from({ length }, (_, index) => (index + 1) % 255).buffer;
const subscription = endpoint => ({
  endpoint,
  unsubscribed: 0,
  getKey(name) { return makeKey(name === 'p256dh' ? 65 : 16); },
  async unsubscribe() { this.unsubscribed += 1; return true; }
});

function harness({ owner = '', permission = 'granted', persistError = null } = {}) {
  let current = owner ? subscription('https://push.example.test/stale') : null;
  const created = [];
  const saved = [];
  const removed = [];
  let beforeSignOut = null;
  const storage = new Map(owner ? [['bq:v5:push-owner', owner]] : []);
  const ownerStorage = {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
  };
  const session = {
    getState: () => ({ authenticated: true, user: { id: 'user-a' } }),
    beforeSignOut(listener) { beforeSignOut = listener; return () => { beforeSignOut = null; }; }
  };
  const pushManager = {
    async getSubscription() { return current; },
    async subscribe(options) {
      assert.equal(options.userVisibleOnly, true);
      assert.ok(options.applicationServerKey instanceof Uint8Array);
      current = subscription(`https://push.example.test/new-${created.length + 1}`);
      created.push(current);
      return current;
    }
  };
  const repository = {
    async upsert(row) { if (persistError) throw persistError; saved.push(row); return row; },
    async removeByEndpoint(endpoint) { removed.push(endpoint); }
  };
  const notification = {
    permission,
    async requestPermission() { return permission; }
  };
  const service = createPushSubscriptionService({
    session,
    repository,
    serviceWorker: { ready: Promise.resolve({ pushManager }) },
    notification,
    applicationServerKey: 'AQIDBA',
    ownerStorage
  });
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
  assert.equal(h.saved[0].user_id, 'user-a');
  assert.deepEqual(h.saved[0].enabled_categories, ['assignment']);
  assert.equal(h.storage.get('bq:v5:push-owner'), 'user-a');
  await h.beforeSignOut();
  assert.deepEqual(h.removed, [h.saved[0].endpoint], 'sign-out must remove the owned backend endpoint first');
  assert.equal(h.current.unsubscribed, 1, 'sign-out must unsubscribe the browser endpoint');
  assert.equal(h.storage.has('bq:v5:push-owner'), false, 'sign-out must clear local account ownership');
}

{
  const h = harness({ permission: 'denied' });
  await assert.rejects(() => h.service.enable(['assignment']), /permission was not granted/i);
  assert.equal(h.created.length, 0, 'denied permission must not create a subscription');
  assert.equal(h.saved.length, 0, 'denied permission must not persist delivery material');
}

{
  const h = harness({ persistError: new Error('backend unavailable') });
  await assert.rejects(() => h.service.enable(['media']), /backend unavailable/);
  assert.equal(h.created.length, 1);
  assert.equal(h.created[0].unsubscribed, 1, 'failed persistence must not leave an unowned live browser subscription');
  assert.equal(h.storage.has('bq:v5:push-owner'), false);
}

{
  const h = harness();
  await assert.rejects(() => h.service.enable([]), /at least one/i, 'push must default off until a category is explicitly selected');
}

const workerSource = await readFile(new URL('../offline-shell-sw.js', import.meta.url), 'utf8');
assert.match(workerSource, /addEventListener\('push'/, 'current worker must receive push events');
assert.match(workerSource, /addEventListener\('notificationclick'/, 'current worker must handle notification clicks');
assert.match(workerSource, /url\.origin===self\.location\.origin/, 'notification click targets must be same-origin');
assert.doesNotMatch(workerSource, /backgroundsync|periodicsync/i, 'Phase 4 must not add a background-sync engine');

console.log('PASS v5 push subscription lifecycle');

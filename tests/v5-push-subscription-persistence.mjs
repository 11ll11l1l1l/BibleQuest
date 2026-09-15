import assert from 'node:assert/strict';
import { createPushSubscriptionPersistence } from '../src/app/push-subscription-persistence.js';

const state = { authenticated: true, remoteAvailable: true, user: { id: 'user-a' } };
const calls = [];
const api = {
  async upsert(row) { calls.push(['upsert', row]); return { ...row }; },
  async remove(userId, endpoint) { calls.push(['remove', userId, endpoint]); },
};
const persistence = createPushSubscriptionPersistence({ api, session: { getState: () => state } });
const subscription = {
  endpoint: 'https://push.example/device-a',
  toJSON: () => ({ endpoint: 'https://push.example/device-a', keys: { p256dh: 'public-key', auth: 'auth-key' } }),
};

const saved = await persistence.save(subscription, ['Assignments', 'assignments', '', 'Ministry']);
assert.equal(saved.user_id, 'user-a');
assert.deepEqual(saved.categories, ['assignments', 'ministry']);
assert.deepEqual(calls[0], ['upsert', {
  user_id: 'user-a', endpoint: subscription.endpoint, p256dh: 'public-key', auth: 'auth-key', categories: ['assignments', 'ministry'],
}]);

await persistence.remove(subscription);
assert.deepEqual(calls[1], ['remove', 'user-a', subscription.endpoint]);

const hostile = createPushSubscriptionPersistence({
  session: { getState: () => state },
  api: { ...api, async upsert(row) { return { ...row, user_id: 'user-b' }; } },
});
await assert.rejects(() => hostile.save(subscription), error => error.code === 'BQ_PUSH_SCOPE');

state.authenticated = false;
await assert.rejects(() => persistence.save(subscription), error => error.code === 'BQ_PUSH_AUTH_REQUIRED');
await assert.rejects(() => persistence.remove(subscription.endpoint), error => error.code === 'BQ_PUSH_AUTH_REQUIRED');

state.authenticated = true;
state.remoteAvailable = false;
await assert.rejects(() => persistence.save(subscription), error => error.code === 'BQ_PUSH_REMOTE_DISABLED');

console.log('V5 push subscription persistence: PASS');

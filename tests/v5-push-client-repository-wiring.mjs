import test from 'node:test';
import assert from 'node:assert/strict';
import { createPushSubscriptionRepository } from '../src/app/push-subscription-repository.js';

function fakeTable({ result = null, error = null } = {}) {
  const calls = [];
  const terminal = { single: async () => ({ data: result, error }) };
  const select = fields => { calls.push(['select', fields]); return terminal; };
  const eq = (field, value) => { calls.push(['eq', field, value]); return { ...terminal, select, eq }; };
  const api = {
    calls,
    upsert(payload, options) { calls.push(['upsert', payload, options]); return { select }; },
    delete() { calls.push(['delete']); return { eq }; }
  };
  return api;
}

const row = {
  user_id: 'user-a',
  endpoint: 'https://push.example.net/subscription/abc',
  p256dh: 'p256dh-key',
  auth: 'auth-key',
  enabled_categories: ['assignment']
};

test('upsert persists only delivery material and explicit categories by endpoint', async () => {
  const table = fakeTable({ result: { id: 'sub-1', ...row } });
  const repo = createPushSubscriptionRepository({ from: name => {
    assert.equal(name, 'bible_push_subscriptions');
    return table;
  }});
  const saved = await repo.upsert(row);
  assert.equal(saved.user_id, 'user-a');
  assert.deepEqual(table.calls[0], ['upsert', row, { onConflict: 'endpoint' }]);
  assert.ok(!JSON.stringify(table.calls).includes('service_role'));
});

test('upsert fails closed if persistence returns a different account owner', async () => {
  const table = fakeTable({ result: { id: 'sub-1', ...row, user_id: 'user-b' } });
  const repo = createPushSubscriptionRepository({ from: () => table });
  await assert.rejects(() => repo.upsert(row), /unexpected owner/i);
});

test('removeByEndpoint scopes cleanup to the exact browser endpoint', async () => {
  const table = fakeTable();
  const repo = createPushSubscriptionRepository({ from: () => table });
  assert.equal(await repo.removeByEndpoint(row.endpoint), true);
  assert.deepEqual(table.calls, [['delete'], ['eq', 'endpoint', row.endpoint]]);
});

test('invalid/incomplete persistence input is rejected before table access', async () => {
  let touched = false;
  const repo = createPushSubscriptionRepository({ from: () => { touched = true; return fakeTable(); } });
  await assert.rejects(() => repo.upsert({ ...row, user_id: '' }), /account is required/i);
  await assert.rejects(() => repo.upsert({ ...row, endpoint: '' }), /endpoint is invalid/i);
  await assert.rejects(() => repo.upsert({ ...row, auth: '' }), /key material is incomplete/i);
  assert.equal(touched, false);
});

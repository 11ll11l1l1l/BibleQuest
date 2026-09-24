import assert from 'node:assert/strict';
import test from 'node:test';

import { appBadgeCapability, clearAppBadge, setAppBadge } from '../../src/app/app-badge.js';

test('app badge reports native capability without assuming support', () => {
  assert.deepEqual(appBadgeCapability({}), { set: false, clear: false });
  assert.deepEqual(appBadgeCapability({ setAppBadge() {}, clearAppBadge() {} }), {
    set: true,
    clear: true,
  });
});

test('app badge sets a normalized positive badge count', async () => {
  const calls: number[] = [];
  const setAppBadgeNative = async (count: number) => { calls.push(count); };
  const result = await setAppBadge(3.9, { setAppBadge: setAppBadgeNative });

  assert.deepEqual(calls, [3]);
  assert.deepEqual(result, { status: 'set', count: 3 });
});

test('app badge clears for zero or invalid counts without calling setAppBadge', async () => {
  const setCalls: number[] = [];
  let clearCalls = 0;
  const navigatorLike = {
    setAppBadge: async (count: number) => { setCalls.push(count); },
    clearAppBadge: async () => { clearCalls += 1; },
  };

  assert.deepEqual(await setAppBadge(0, navigatorLike), { status: 'cleared', count: 0 });
  assert.deepEqual(await setAppBadge(Number.NaN, navigatorLike), { status: 'cleared', count: 0 });
  assert.deepEqual(setCalls, []);
  assert.equal(clearCalls, 2);
});

test('app badge fails closed when badge APIs are unsupported', async () => {
  assert.deepEqual(await setAppBadge(4, {}), { status: 'unsupported', count: 4 });
  assert.deepEqual(await clearAppBadge({}), { status: 'unsupported' });
});

test('app badge contains native failures and does not invent badge state', async () => {
  const navigatorLike = {
    setAppBadge: async () => { throw new Error('denied'); },
    clearAppBadge: async () => { throw new Error('denied'); },
  };

  assert.deepEqual(await setAppBadge(2, navigatorLike), { status: 'failed', count: 2 });
  assert.deepEqual(await clearAppBadge(navigatorLike), { status: 'failed' });
});

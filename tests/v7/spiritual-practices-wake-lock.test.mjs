import test from 'node:test';
import assert from 'node:assert/strict';
import { createPracticeWakeLock } from '../../src/features/spiritual-practices/wake-lock.js';
test('wake lock is opt-in and releases exactly the held sentinel', async () => {
  let requests = 0, releases = 0;
  const lock = createPracticeWakeLock({ request: async () => { requests++; return { release: async () => { releases++; } }; } });
  assert.equal(requests, 0);
  await lock.acquire();
  assert.equal(lock.isActive(), true);
  await lock.release();
  await lock.release();
  assert.equal(releases, 1);
  assert.equal(lock.isActive(), false);
});
test('an in-flight request cannot retain a screen lock after page exit/account switch', async () => {
  let resolve, releases = 0;
  const lock = createPracticeWakeLock({ request: () => new Promise(done => { resolve = done; }) });
  const pending = lock.acquire();
  await Promise.resolve();
  await lock.release();
  resolve({ release: async () => { releases++; } });
  assert.equal(await pending, false);
  assert.equal(releases, 1);
  assert.equal(lock.isActive(), false);
});
test('unsupported and browser-released locks are observable without claiming background support', async () => {
  const missing = createPracticeWakeLock({ request: async () => undefined });
  await assert.rejects(missing.acquire(), /not supported/);
  const sentinel = { released: false, release: async () => {} };
  const lock = createPracticeWakeLock({ request: async () => sentinel });
  await lock.acquire();
  sentinel.released = true;
  assert.equal(lock.isActive(), false);
});

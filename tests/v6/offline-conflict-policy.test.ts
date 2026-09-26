import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyOfflineConflict } from '../../src/v6/offline/conflict-policy.ts';

const safe = {
  domain: 'example',
  operation: 'upsert',
  risk: 'safe-idempotent',
  queueable: true,
} as const;

test('classifies one-sided, no-change and concurrent safe-idempotent conflicts deterministically', () => {
  assert.deepEqual(
    classifyOfflineConflict(safe, { localChanged: true, serverChanged: false }),
    { resolution: 'keep-local', reason: 'local-only-change' },
  );
  assert.deepEqual(
    classifyOfflineConflict(safe, { localChanged: false, serverChanged: true }),
    { resolution: 'keep-server', reason: 'server-only-change' },
  );
  assert.deepEqual(
    classifyOfflineConflict(safe, { localChanged: false, serverChanged: false }),
    { resolution: 'keep-server', reason: 'no-change' },
  );
  assert.deepEqual(
    classifyOfflineConflict(safe, { localChanged: true, serverChanged: true }),
    { resolution: 'needs-user-resolution', reason: 'concurrent-change' },
  );
});

test('domain-proved semantic equivalence keeps canonical server state even when both sides changed', () => {
  assert.deepEqual(
    classifyOfflineConflict(safe, {
      localChanged: true,
      serverChanged: true,
      semanticallyEquivalent: true,
    }),
    { resolution: 'keep-server', reason: 'equivalent' },
  );
});

test('unapproved, privileged, destructive, unknown and incomplete policies all fail closed', () => {
  const facts = { localChanged: true, serverChanged: false };

  assert.deepEqual(
    classifyOfflineConflict(null, facts),
    { resolution: 'needs-user-resolution', reason: 'unsafe-policy' },
  );
  assert.deepEqual(
    classifyOfflineConflict({ ...safe, queueable: false }, facts),
    { resolution: 'needs-user-resolution', reason: 'unsafe-policy' },
  );
  assert.deepEqual(
    classifyOfflineConflict({ ...safe, risk: 'privileged' }, facts),
    { resolution: 'needs-user-resolution', reason: 'unsafe-policy' },
  );
  assert.deepEqual(
    classifyOfflineConflict({ ...safe, risk: 'destructive' }, facts),
    { resolution: 'needs-user-resolution', reason: 'unsafe-policy' },
  );
  assert.deepEqual(
    classifyOfflineConflict({ ...safe, risk: 'unknown' }, facts),
    { resolution: 'needs-user-resolution', reason: 'unsafe-policy' },
  );
  assert.deepEqual(
    classifyOfflineConflict({ ...safe, domain: '   ' }, facts),
    { resolution: 'needs-user-resolution', reason: 'unsafe-policy' },
  );
  assert.deepEqual(
    classifyOfflineConflict({ ...safe, operation: '' }, facts),
    { resolution: 'needs-user-resolution', reason: 'unsafe-policy' },
  );
});

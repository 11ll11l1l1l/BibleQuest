import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyOfflineConflict } from '../../src/v6/offline/conflict-policy.ts';

const safe = { domain: 'example', operation: 'upsert', risk: 'safe-idempotent', queueable: true } as const;

test('classifies one-sided and concurrent changes', () => {
  assert.equal(classifyOfflineConflict(safe, { localChanged: true, serverChanged: false }).resolution, 'keep-local');
  assert.equal(classifyOfflineConflict(safe, { localChanged: false, serverChanged: true }).resolution, 'keep-server');
  assert.equal(classifyOfflineConflict(safe, { localChanged: true, serverChanged: true }).resolution, 'needs-user-resolution');
});

test('equivalent state keeps canonical server state', () => {
  assert.equal(classifyOfflineConflict(safe, { localChanged: true, serverChanged: true, semanticallyEquivalent: true }).resolution, 'keep-server');
});

test('unapproved policy fails closed', () => {
  assert.equal(classifyOfflineConflict(null, { localChanged: true, serverChanged: false }).resolution, 'needs-user-resolution');
  assert.equal(classifyOfflineConflict({ ...safe, queueable: false }, { localChanged: true, serverChanged: false }).resolution, 'needs-user-resolution');
});

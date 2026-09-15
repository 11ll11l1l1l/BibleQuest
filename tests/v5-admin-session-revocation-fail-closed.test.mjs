import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const adminOpsSource = fs.readFileSync(
  new URL('../supabase/functions/bq-admin-ops/index.ts', import.meta.url),
  'utf8',
);

test('sensitive admin credential changes require successful session revocation', () => {
  assert.match(
    adminOpsSource,
    /async function requireSessionRevocation\(targetUserId:string\)/,
    'admin ops must expose a fail-closed session revocation helper',
  );

  assert.match(
    adminOpsSource,
    /if\(!revoked\)throw new Error\('Session revocation failed: target user not found'\)/,
    '404/not-found revocation must fail the sensitive admin operation',
  );

  const requiredCalls = adminOpsSource.match(/await requireSessionRevocation\(target\)/g) || [];
  assert.equal(
    requiredCalls.length,
    3,
    'suspend, temporary-password reset, and email change must all fail closed on revocation failure',
  );

  assert.doesNotMatch(
    adminOpsSource,
    /force-sign-out-on-(?:suspend|temp-password|email-change)/,
    'sensitive paths must not swallow session-revocation errors',
  );
});

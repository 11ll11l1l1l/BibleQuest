import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  ADMIN_ACTION_POLICIES,
  assertAdminMutationAllowed,
} from '../../src/v6/admin/contracts.ts';

const apiSource = fs.readFileSync(new URL('../../src/core/api.js', import.meta.url), 'utf8');

test('Admin mutation policy fails closed while offline', () => {
  for (const policy of ADMIN_ACTION_POLICIES) {
    assert.throws(
      () => assertAdminMutationAllowed(policy.transportAction, { online: false }),
      (error: unknown) =>
        error instanceof Error &&
        (error as Error & { code?: string }).code === 'BQ_ADMIN_OFFLINE_FORBIDDEN',
      `${policy.transportAction} must be denied while offline`,
    );
  }
});

test('Admin mutation policy rejects unknown actions before connectivity handling', () => {
  assert.throws(
    () => assertAdminMutationAllowed('not_an_admin_action', { online: false }),
    /Unknown V6 Admin transport action/,
  );
  assert.throws(
    () => assertAdminMutationAllowed('', { online: true }),
    /Unknown V6 Admin transport action/,
  );
});

test('Admin mutation policy returns the canonical transport action while online', () => {
  for (const policy of ADMIN_ACTION_POLICIES) {
    assert.equal(
      assertAdminMutationAllowed(policy.transportAction, { online: true }).transportAction,
      policy.transportAction,
    );
  }
});

test('live API imports the V6 Admin policy and routes every typed mutation through it', () => {
  assert.match(apiSource, /assertAdminMutationAllowed/);
  assert.match(apiSource, /navigator\.onLine !== false/);

  for (const policy of ADMIN_ACTION_POLICIES) {
    assert.match(
      apiSource,
      new RegExp(`invokeAdminMutation\\([^\\n]+['"]${policy.transportAction}['"]`),
      `live API must route ${policy.transportAction} through the typed mutation guard`,
    );
  }
});

test('Admin read/status calls remain outside the mutation guard', () => {
  assert.match(apiSource, /invoke\('bq-admin',\{action:'status'\}\)/);
  assert.match(apiSource, /invoke\('bq-admin',\{action:'list_users'/);
  assert.match(apiSource, /invoke\('bq-admin-ops',\{action:'dashboard'\}\)/);
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  ADMIN_ACTION_POLICIES,
  adminActionPolicy,
  assertSafeAdminAuditDetail,
  auditActionForTransport,
  parseAdminAuditRecord,
} from '../../src/v6/admin/contracts.ts';

const adminSource = fs.readFileSync(new URL('../../supabase/functions/bq-admin/index.ts', import.meta.url), 'utf8');
const adminOpsSource = fs.readFileSync(new URL('../../supabase/functions/bq-admin-ops/index.ts', import.meta.url), 'utf8');
const clientSource = fs.readFileSync(new URL('../../src/core/api.js', import.meta.url), 'utf8');

test('Admin mutation inventory is unique, deny-offline, and audit-mapped', () => {
  const transports = ADMIN_ACTION_POLICIES.map((policy) => policy.transportAction);
  assert.equal(new Set(transports).size, transports.length);
  assert.equal(transports.length, 13);
  for (const policy of ADMIN_ACTION_POLICIES) {
    assert.equal(policy.offline, 'forbidden', `${policy.transportAction} must never be blindly queued offline`);
    assert.ok(policy.auditAction);
  }
});

test('Admin contract preserves transport/audit naming and privileged recovery semantics', () => {
  assert.equal(auditActionForTransport('delete_user'), 'delete_account');
  assert.equal(adminActionPolicy('delete_user').authority, 'owner-only');
  assert.equal(adminActionPolicy('delete_user').terminatesAccount, true);

  for (const action of ['suspend_account', 'force_sign_out', 'set_temp_password', 'change_email']) {
    assert.equal(adminActionPolicy(action).revokesSessions, true, `${action} must revoke sessions`);
  }
  assert.equal(adminActionPolicy('reactivate_account').revokesSessions, false);

  assert.equal(adminActionPolicy('set_temp_password').authority, 'owner-only');
  assert.deepEqual(adminActionPolicy('set_temp_password').sensitiveInputKeys, ['password']);
  assert.equal(adminActionPolicy('change_email').authority, 'owner-only');
  assert.deepEqual(adminActionPolicy('change_email').sensitiveInputKeys, ['email']);
  assert.throws(() => adminActionPolicy('not_an_admin_action'), /Unknown V6 Admin transport action/);
});

test('Admin audit detail rejects secret-bearing field names recursively without rejecting safe flags', () => {
  const safe = assertSafeAdminAuditDetail({
    sessionsRevoked: true,
    emailChanged: true,
    stage: 'prepared',
    nested: { groupId: 'group-a' },
  });
  assert.equal(safe.emailChanged, true);

  for (const detail of [
    { password: 'secret' },
    { temp_password: 'secret' },
    { nested: { newEmail: 'person@example.test' } },
    { token: 'jwt' },
    { deeper: [{ vapid_private_key: 'secret' }] },
  ]) {
    assert.throws(() => assertSafeAdminAuditDetail(detail), /forbidden sensitive field/);
  }
  assert.throws(() => assertSafeAdminAuditDetail([]), /must be an object/);
});

test('Admin audit rows are typed, normalized, and fail closed on unknown actions', () => {
  const parsed = parseAdminAuditRecord({
    id: 'audit-1',
    actor_id: 'owner-a',
    target_user_id: 'member-b',
    action: 'change_email',
    detail: { emailChanged: true, sessionsRevoked: true },
    created_at: '2026-09-25T00:00:00.000Z',
  });

  assert.deepEqual(parsed, {
    id: 'audit-1',
    actorId: 'owner-a',
    targetUserId: 'member-b',
    action: 'change_email',
    detail: { emailChanged: true, sessionsRevoked: true },
    createdAt: '2026-09-25T00:00:00.000Z',
  });

  assert.throws(
    () => parseAdminAuditRecord({ id: 'audit-2', action: 'unknown', detail: {}, created_at: '2026-09-25T00:00:00Z' }),
    /Unknown Admin audit action/,
  );
  assert.throws(
    () => parseAdminAuditRecord({ id: 'audit-3', action: 'set_role', detail: { password: 'never' }, created_at: '2026-09-25T00:00:00Z' }),
    /forbidden sensitive field/,
  );
});

test('typed Admin transport inventory stays aligned with the existing client and server actions', () => {
  const consoleActions = [
    'set_role',
    'set_congregation',
    'remove_congregation',
    'set_congregation_role',
    'create_small_group',
    'set_group_membership',
    'set_group_owner',
  ];
  const operationsActions = [
    'delete_user',
    'suspend_account',
    'reactivate_account',
    'force_sign_out',
    'set_temp_password',
    'change_email',
  ];

  for (const action of consoleActions) {
    assert.match(adminSource, new RegExp(`['"]${action}['"]`), `bq-admin is missing ${action}`);
    assert.match(clientSource, new RegExp(`action:['"]${action}['"]`), `client API is missing ${action}`);
  }
  for (const action of operationsActions) {
    assert.match(adminOpsSource, new RegExp(`['"]${action}['"]`), `bq-admin-ops is missing ${action}`);
    assert.match(clientSource, new RegExp(`action:['"]${action}['"]`), `client API is missing ${action}`);
  }

  for (const policy of ADMIN_ACTION_POLICIES) {
    const source = consoleActions.includes(policy.transportAction) ? adminSource : adminOpsSource;
    assert.match(source, new RegExp(`['"]${policy.auditAction}['"]`), `server audit action is missing ${policy.auditAction}`);
  }
});

test('high-risk Admin Operations require pre-mutation audit and never audit raw password/email values', () => {
  for (const action of ['delete_user', 'suspend_account', 'reactivate_account', 'force_sign_out', 'set_temp_password', 'change_email']) {
    assert.equal(adminActionPolicy(action).auditMode, 'required-before-and-after');
  }
  assert.match(adminOpsSource, /auditRequired\(/);
  assert.match(adminOpsSource, /set_temp_password',\{sessionsRevoked:true\}/);
  assert.match(adminOpsSource, /change_email',\{emailChanged:true,sessionsRevoked:true\}/);
  assert.doesNotMatch(adminOpsSource, /set_temp_password',\{[^}]*password\s*:/i);
  assert.doesNotMatch(adminOpsSource, /change_email',\{[^}]*email\s*:/i);
});

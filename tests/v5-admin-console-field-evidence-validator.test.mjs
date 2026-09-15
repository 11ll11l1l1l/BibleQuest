import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REQUIRED_ACTIONS,
  validateAdminConsoleFieldEvidence,
} from '../scripts/v5-validate-admin-console-field-evidence.mjs';

function completeEvidence() {
  return {
    integration_sha: 'dfcb851b38326edef0e4969958eb15866c673c8d',
    executed_at: '2026-09-13T18:30:00+09:00',
    environment: 'controlled non-production test environment',
    operator: 'BQ-V5-field-test',
    actions: Object.entries(REQUIRED_ACTIONS).map(([action, contract]) => ({
      action,
      severity: contract.severity,
      confirmation: contract.confirmation,
      actor_role: action === 'recovery_email_change' ? 'owner' : 'owner/admin',
      target_kind: 'disposable test user',
      evidence_level: 'GUIDED_REAL_BACKEND',
      result: 'PASS',
      observed: `${action} produced the expected controlled test outcome`,
    })),
  };
}

test('complete real-backend evidence is phase-ready', () => {
  const result = validateAdminConsoleFieldEvidence(completeEvidence());
  assert.deepEqual(result, { valid: true, phaseReady: true, errors: [], blockers: [] });
});

test('NOT_RUN action remains a phase blocker without corrupting evidence shape', () => {
  const evidence = completeEvidence();
  evidence.actions.find((entry) => entry.action === 'temporary_password').result = 'NOT_RUN';

  const result = validateAdminConsoleFieldEvidence(evidence);
  assert.equal(result.valid, true);
  assert.equal(result.phaseReady, false);
  assert.deepEqual(result.blockers, ['temporary_password: NOT_RUN']);
});

test('critical typed confirmation must be recorded exactly', () => {
  const evidence = completeEvidence();
  evidence.actions.find((entry) => entry.action === 'delete_account').confirmation = 'delete';

  const result = validateAdminConsoleFieldEvidence(evidence);
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /delete_account: confirmation must record exact phrase DELETE/);
});

test('static-only claims cannot satisfy the field-evidence gate', () => {
  const evidence = completeEvidence();
  evidence.actions[0].evidence_level = 'STATIC';

  const result = validateAdminConsoleFieldEvidence(evidence);
  assert.equal(result.valid, false);
  assert.equal(result.phaseReady, false);
  assert.match(result.errors.join('\n'), /evidence_level must be GUIDED_REAL_BACKEND or REAL_DEVICE/);
});

test('all required Admin Console action families must be represented exactly once', () => {
  const evidence = completeEvidence();
  evidence.actions = evidence.actions.filter((entry) => entry.action !== 'suspend');
  evidence.actions.push({ ...evidence.actions[0] });

  const result = validateAdminConsoleFieldEvidence(evidence);
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /duplicate action evidence: force_sign_out/);
  assert.match(result.errors.join('\n'), /missing required action evidence: suspend/);
});

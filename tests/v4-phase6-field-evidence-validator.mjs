import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const validator = path.join(root, 'scripts', 'validate-v4-phase6-field-evidence.mjs');
const temp = await mkdtemp(path.join(os.tmpdir(), 'bq-v4-field-evidence-'));
const SHA = '4f908ad8b53f3feb00f21ae27dd4707597b5aa14';

function pendingEvidence() {
  return {
    schema: 'biblequest-v4-phase6-field-evidence/v1',
    updated_jst: '2026-09-13T05:00:00+09:00',
    certified_application_sha: SHA,
    promotion_policy: 'All seven gates A-G must be PASS or explicitly owner-WAIVED before production promotion.',
    notes: 'Sanitized release evidence only.',
    gates: {
      A: { status: 'pending', title: 'Authenticated emergency-action matrix' },
      B: { status: 'pending', title: 'Account switching and stale-state clearing' },
      C: { status: 'pending', title: 'True cross-congregation field isolation' },
      D: { status: 'pending', title: 'Physical Android Chrome at 100% zoom' },
      E: { status: 'pending', title: 'Physical Android Brave at 100% zoom' },
      F: { status: 'pending', title: 'Installed Android PWA acceptance' },
      G: { status: 'pending', title: 'Issue #68 linked-activity multi-account field validation' }
    }
  };
}

function commonPass(title) {
  return {
    status: 'pass',
    title,
    observed_at_jst: '2026-09-13T05:01:00+09:00',
    application_sha: SHA,
    host: 'https://staging.example.invalid',
    expected_behavior: 'The documented release contract holds.',
    observed_behavior: 'The operator observed the documented release contract.',
    evidence_refs: ['sanitized-operator-record']
  };
}

async function runFixture(name, evidence, extraArgs = []) {
  const file = path.join(temp, `${name}.json`);
  await writeFile(file, JSON.stringify(evidence, null, 2) + '\n', 'utf8');
  return spawnSync(process.execPath, [validator, '--file', file, ...extraArgs], {
    cwd: root,
    encoding: 'utf8'
  });
}

function output(result) {
  return `${result.stdout || ''}\n${result.stderr || ''}`;
}

try {
  {
    const result = await runFixture('pending-valid', pendingEvidence());
    assert.equal(result.status, 0, output(result));
    assert.match(output(result), /schema\/readiness/);
  }

  {
    const evidence = pendingEvidence();
    evidence.gates.A = {
      ...commonPass('Authenticated emergency-action matrix'),
      real_authenticated_sessions: true,
      safe_target_designated: true,
      independent_target_sessions: 2,
      actions: {
        authorization: 'pass',
        force_sign_out: 'pass',
        suspend_reactivate: 'pass',
        set_temp_password: 'pass',
        change_email: 'pass'
      },
      audit_secret_hygiene_verified: true,
      session_revocation_observed: true
    };
    const result = await runFixture('gate-a-satisfiable', evidence);
    assert.equal(result.status, 0, output(result));
  }

  {
    const evidence = pendingEvidence();
    evidence.gates.A = {
      ...commonPass('Authenticated emergency-action matrix'),
      real_authenticated_sessions: true,
      safe_target_designated: true,
      independent_target_sessions: 2,
      actions: {
        authorization: 'pass',
        force_sign_out: 'pass',
        suspend_reactivate: 'pass',
        set_temp_password: 'pass',
        change_email: 'pass'
      },
      audit_secret_hygiene_verified: true,
      session_revocation_observed: true,
      set_temp_password_value: 'must-never-be-committed'
    };
    const result = await runFixture('secret-key-rejected', evidence);
    assert.notEqual(result.status, 0, 'secret-bearing evidence key must fail');
    assert.match(output(result), /forbidden sensitive evidence key/);
  }

  {
    const evidence = pendingEvidence();
    evidence.gates.D = {
      ...commonPass('Physical Android Chrome at 100% zoom'),
      device: { model: 'Emulated device', android_version: '15' },
      physical_device: false,
      browser: { name: 'Chrome', version: '140' },
      zoom: '100%',
      no_document_horizontal_scroll: true,
      critical_routes_touch_usable: true,
      rotation_recovery_verified: true
    };
    const result = await runFixture('emulator-rejected', evidence);
    assert.notEqual(result.status, 0, 'non-physical Gate D evidence must fail');
    assert.match(output(result), /physical_device=true/);
  }

  {
    const evidence = pendingEvidence();
    evidence.gates.G = {
      ...commonPass('Issue #68 linked-activity multi-account field validation'),
      real_authenticated_sessions: true,
      normal_product_paths_only: true,
      distinct_authenticated_accounts: 3,
      scenarios: {
        journey_group_create_join_persistence: 'pass',
        journey_group_assignment_and_unrelated_denial: 'pass',
        cloud_team_management_assignment_and_denial: 'pass',
        linked_couple_accept_assignment_and_unrelated_isolation: 'pass',
        couples_challenge_shared_day_individual_points: 'pass',
        live_room_realtime_reconnect_and_isolation: 'pass',
        reload_relogin_persistence: 'pass'
      }
    };
    const result = await runFixture('gate-g-incomplete', evidence);
    assert.notEqual(result.status, 0, 'incomplete Gate G scenario matrix must fail');
    assert.match(output(result), /read_only_postrun_confirmation=pass/);
  }

  {
    const evidence = pendingEvidence();
    evidence.gates.B = {
      ...commonPass('Account switching and stale-state clearing'),
      application_sha: '1111111111111111111111111111111111111111',
      real_authenticated_sessions: true,
      same_storage_switch_roundtrip: true,
      stale_private_state_cleared: true,
      stale_privileged_controls_cleared: true,
      backend_authorization_verified: true
    };
    const result = await runFixture('wrong-sha-rejected', evidence);
    assert.notEqual(result.status, 0, 'evidence from a different application SHA must fail');
    assert.match(output(result), /application_sha must match certified_application_sha/);
  }

  {
    const result = await runFixture('production-still-blocked', pendingEvidence(), ['--require-complete']);
    assert.notEqual(result.status, 0, 'pending field gates must block production mode');
    assert.match(output(result), /field gates neither PASS nor owner-WAIVED: A, B, C, D, E, F, G/);
  }

  console.log('BibleQuest V4 Phase 6 field-evidence validator regression PASS.');
} finally {
  await rm(temp, { recursive: true, force: true });
}

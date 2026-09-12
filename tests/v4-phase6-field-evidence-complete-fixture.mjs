import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const validator = path.join(root, 'scripts', 'validate-v4-phase6-field-evidence.mjs');
const temp = await mkdtemp(path.join(os.tmpdir(), 'bq-v4-complete-evidence-'));
const fixturePath = path.join(temp, 'synthetic-complete.json');
const SHA = '4f908ad8b53f3feb00f21ae27dd4707597b5aa14';

const common = title => ({
  status: 'pass',
  title,
  observed_at_jst: '2026-09-13T05:30:00+09:00',
  application_sha: SHA,
  host: 'https://fixture.invalid',
  expected_behavior: 'Synthetic validator fixture expects the documented contract.',
  observed_behavior: 'Synthetic validator fixture supplies every required structural field.',
  evidence_refs: ['synthetic-validator-fixture-only']
});

const evidence = {
  schema: 'biblequest-v4-phase6-field-evidence/v1',
  updated_jst: '2026-09-13T05:30:00+09:00',
  certified_application_sha: SHA,
  promotion_policy: 'Synthetic test fixture only; never production evidence.',
  notes: 'This object exists only in a temporary test file and does not assert real field execution.',
  gates: {
    A: {
      ...common('Authenticated emergency-action matrix'),
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
    },
    B: {
      ...common('Account switching and stale-state clearing'),
      real_authenticated_sessions: true,
      same_storage_switch_roundtrip: true,
      stale_private_state_cleared: true,
      stale_privileged_controls_cleared: true,
      backend_authorization_verified: true
    },
    C: {
      ...common('True cross-congregation field isolation'),
      real_authenticated_sessions: true,
      distinct_populated_congregations: 2,
      cross_congregation_read_isolation_verified: true,
      cross_congregation_write_isolation_verified: true,
      deep_link_and_code_bypass_denied: true
    },
    D: {
      ...common('Physical Android Chrome at 100% zoom'),
      device: { model: 'Physical Android fixture', android_version: '15' },
      physical_device: true,
      browser: { name: 'Chrome', version: '140' },
      zoom: '100%',
      no_document_horizontal_scroll: true,
      critical_routes_touch_usable: true,
      rotation_recovery_verified: true
    },
    E: {
      ...common('Physical Android Brave at 100% zoom'),
      device: { model: 'Physical Android fixture', android_version: '15' },
      physical_device: true,
      browser: { name: 'Brave', version: '1.84' },
      zoom: '100%',
      no_document_horizontal_scroll: true,
      critical_routes_touch_usable: true,
      rotation_recovery_verified: true
    },
    F: {
      ...common('Installed Android PWA acceptance'),
      device: { model: 'Physical Android fixture', android_version: '15' },
      physical_device: true,
      installed_pwa: true,
      install_source_browser: 'Chrome',
      standalone_launch_verified: true,
      offline_contract_verified: true,
      reconnect_without_reinstall_verified: true,
      relaunch_state_verified: true
    },
    G: {
      ...common('Issue #68 linked-activity multi-account field validation'),
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
        reload_relogin_persistence: 'pass',
        read_only_postrun_confirmation: 'pass'
      }
    }
  }
};

try {
  await writeFile(fixturePath, JSON.stringify(evidence, null, 2) + '\n', 'utf8');
  const result = spawnSync(process.execPath, [validator, '--file', fixturePath, '--require-complete'], {
    cwd: root,
    encoding: 'utf8'
  });
  const combined = `${result.stdout || ''}\n${result.stderr || ''}`;
  assert.equal(result.status, 0, combined);
  assert.match(combined, /production-complete/);
  console.log('BibleQuest V4 Phase 6 complete synthetic evidence fixture PASS.');
} finally {
  await rm(temp, { recursive: true, force: true });
}

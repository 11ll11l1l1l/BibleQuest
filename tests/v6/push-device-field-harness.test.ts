import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = relative => readFileSync(new URL('../../' + relative, import.meta.url), 'utf8');

const html = read('v6-push-device-field.html');
const runtime = read('src/v6/push-device-field.js');
const evidenceRuntime = read('src/v6/push-device-field-evidence.js');
const sharedEvidenceRuntime = read('src/v6/physical-device-evidence.js');
const vite = read('vite.config.mjs');
const headers = read('_headers');
const index = read('index.html');
const bootstrap = read('src/app/bootstrap.js');
const workflow = read('.github/workflows/v6-phase1-build.yml');
const serviceWorkerTest = read('tests/v6/assignment-push-service-worker.test.ts');
const runbook = read('docs/v6/V6_PUSH_DEVICE_FIELD_RUNBOOK.md');
const evidence = read('docs/v6/V6_FIELD_DEVICE_EVIDENCE.md');
const dueRunbook = read('docs/v6/ASSIGNMENT_DUE_REMINDERS.md');
const scheduler = read('supabase/ops/assignment-due-reminder-cron.sql');

test('physical push field harness is an exact-SHA unlinked Vite entrypoint', () => {
  assert.match(html, /QA ONLY — V6 PHYSICAL PUSH FIELD HARNESS/);
  assert.match(html, /data-push-gate="p1"/);
  assert.match(html, /data-push-gate="p2"/);
  assert.match(html, /data-push-gate="p3"/);
  assert.match(html, /data-push-step="real-auth-session"/);
  assert.match(html, /data-push-step="durable-assignment-record"/);
  assert.match(html, /data-push-step="canonical-dispatch"/);
  assert.match(html, /data-push-step="cleanup-complete"/);
  assert.match(html, /data-field-copy-evidence/);
  assert.match(html, /noindex,nofollow,noarchive/);
  assert.match(html, /src\/v6\/push-device-field\.js/);

  assert.match(vite, /viteManagedRootFiles = new Set\(\['index\.html', 'v6-push-device-field\.html'\]\)/);
  assert.match(vite, /pushDeviceField: resolve\(root, 'v6-push-device-field\.html'\)/);
  assert.match(vite, /viteManagedRootFiles\.has\(entry\.name\)/);

  assert.match(headers, /\/v6-push-device-field\.html[\s\S]*?Cache-Control: no-cache, no-store/);
  assert.match(headers, /\/v6-push-device-field\.html[\s\S]*?X-Robots-Tag: noindex, nofollow, noarchive/);

  assert.equal(index.includes('v6-push-device-field'), false, 'field harness must stay outside normal navigation');
  assert.equal(bootstrap.includes('v6-push-device-field'), false, 'field harness must stay outside normal bootstrap');
  assert.match(workflow, /- "v6-push-device-field\.html"/);
});

test('physical push field runtime reuses accepted V6 auth, persistence and service-worker owners', () => {
  assert.match(runtime, /createSessionService/);
  assert.match(runtime, /createPushSubscriptionService/);
  assert.match(runtime, /createPushSubscriptionPersistence/);
  assert.match(runtime, /createApi/);
  assert.match(runtime, /push\.enable\(\['assignment'\]\)/);
  assert.match(runtime, /push\.disable\(\)/);
  assert.match(runtime, /serviceWorker\.register\('\/offline-shell-sw\.js'/);

  assert.match(runtime, /const EXACT_SHA = \/\^\[0-9a-f\]\{40\}\$\/i/);
  assert.match(runtime, /fetch\('\/bq-build\.json'/);
  assert.match(runtime, /COMPILED_BUILD_SHA === artifactBuildSha/);
  assert.match(runtime, /mybiblequest\.pages\.dev/);

  for (const forbidden of [
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SECRET_KEYS',
    'SUPABASE_DB_URL',
    'VAPID_PRIVATE_KEY',
    'privateKey',
    'bq-push-delivery',
  ]) {
    assert.equal(runtime.includes(forbidden), false, 'field runtime must not contain privileged send material/action: ' + forbidden);
  }

  assert.doesNotMatch(runtime, /candidate_sha:\s*state\.user|user_id:|endpoint:/);
  assert.match(runtime, /contains no email, user ID, endpoint, key material, or token/);
});

test('push certification procedure stays fail-closed across browser and physical evidence classes', () => {
  assert.match(runbook, /P1 — assignment push enabled, app closed/);
  assert.match(runbook, /P2 — push disabled preserves Notification Center behavior/);
  assert.match(runbook, /P3 — live due-reminder delivery/);
  assert.match(runbook, /V6 Phase 1 Build Gate/);
  assert.match(runbook, /assignment-push-service-worker\.test\.ts/);
  assert.match(runbook, /PHYSICAL-DEVICE/);
  assert.match(runbook, /BUILT-BROWSER/);

  assert.match(serviceWorkerTest, /assignment assigned push renders the canonical assignments deep link/);
  assert.match(serviceWorkerTest, /assignment due push renders the same canonical assignments deep link/);
  assert.match(serviceWorkerTest, /assignment notification click reuses a same-origin client and focuses it/);

  assert.match(evidence, /## Push certification binding/);
  assert.match(evidence, /Status: PENDING/);
  assert.match(evidence, /BUILT-BROWSER/);
  assert.match(evidence, /PHYSICAL-DEVICE/);
});

test('due-reminder operator documentation cannot drift from the canonical five-minute Vault-backed scheduler', () => {
  for (const token of [
    'bq_assignment_reminder_project_url',
    'bq_assignment_reminder_scheduler_secret',
    'bq-assignment-due-reminders-v6',
    '*/5 * * * *',
  ]) {
    assert.ok(dueRunbook.includes(token), 'due reminder runbook missing canonical token: ' + token);
    assert.ok(scheduler.includes(token), 'scheduler SQL missing canonical token: ' + token);
  }

  for (const stale of [
    'bq_supabase_url',
    'bq_assignment_reminder_service_key',
    'bq_assignment_reminder_secret_key',
  ]) {
    assert.equal(dueRunbook.includes(stale), false, 'stale reminder secret name must not survive: ' + stale);
  }

  assert.doesNotMatch(dueRunbook, /job name: 'bq-assignment-due-reminders'\s*$/m);
  assert.doesNotMatch(dueRunbook, /schedule: every one minute|\* \* \* \* \*/);
});


test('physical push evidence export stays candidate-bound, complete and sanitized', () => {
  const evidenceContract = evidenceRuntime + '\n' + sharedEvidenceRuntime;
  assert.match(evidenceRuntime, /evidenceClass:\s*'PHYSICAL-DEVICE'/);
  assert.match(evidenceRuntime, /candidateSha/);
  assert.match(evidenceRuntime, /physicalDevicePushEvidenceComplete/);
  assert.match(evidenceRuntime, /assignmentAssignedDuePhysicalEvidenceComplete/);
  assert.match(evidenceRuntime, /aggregatePushStillRequiresBuiltBrowserEvidence:\s*true/);
  for (const gate of ['p1', 'p2', 'p3']) {
    assert.match(evidenceRuntime, new RegExp(gate + ':\\s*Object\\.freeze'));
  }
  for (const sensitive of [
    'service_role',
    'sb_secret_',
    'p256dh',
    'password|endpoint|auth',
  ]) {
    assert.match(evidenceContract, new RegExp(sensitive, 'i'));
  }
});

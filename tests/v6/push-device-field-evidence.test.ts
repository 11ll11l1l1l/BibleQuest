import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PUSH_FIELD_GATE_STEPS,
  buildPhysicalPushEvidence,
  validatePhysicalPushEvidence,
} from '../../src/v6/push-device-field-evidence.js';
import {
  evaluatePhysicalPushEvidenceProfile,
} from '../../scripts/v6-validate-push-field-evidence.mjs';

const sha = 'a'.repeat(40);

function gate(id, status = 'PASS') {
  return {
    id,
    status,
    notes: status === 'PASS' ? 'Observed on the physical QA device.' : '',
    steps: PUSH_FIELD_GATE_STEPS[id].map(step => ({ id: step, checked: status === 'PASS' })),
  };
}

function snapshot(overrides = {}) {
  return {
    candidate_sha: sha,
    authenticated: true,
    push_supported: true,
    notification_permission: 'granted',
    service_worker_active: true,
    browser_subscription_present: true,
    owner_marker_matches_current_account: true,
    lifecycle_persistence_verified_this_session: true,
    ...overrides,
  };
}

function record(overrides = {}) {
  return buildPhysicalPushEvidence({
    candidateSha: sha,
    metadata: {
      tester: 'QA operator',
      deviceOsBrowser: 'Android device / Chrome',
      environment: 'immutable Cloudflare preview',
      durableEvidenceReference: 'issue-452-field-run',
    },
    gates: [gate('p1'), gate('p2'), gate('p3')],
    sanitizedSnapshot: snapshot(),
    origin: 'https://abc.mybiblequest.pages.dev',
    observedAt: '2026-10-02T13:45:00.000Z',
    ...overrides,
  });
}

test('physical push evidence binds P1/P2/P3 to one exact candidate SHA', () => {
  const evidence = record();
  assert.equal(evidence.evidenceClass, 'PHYSICAL-DEVICE');
  assert.equal(evidence.candidateSha, sha);
  assert.equal(evidence.gates.length, 3);
  assert.equal(evidence.checklistEligibility.physicalDevicePushEvidenceComplete, true);
  assert.equal(evidence.checklistEligibility.assignmentAssignedDuePhysicalEvidenceComplete, true);
  assert.equal(evidence.checklistEligibility.aggregatePushStillRequiresBuiltBrowserEvidence, true);
  assert.equal(validatePhysicalPushEvidence(evidence, sha).candidateSha, sha);
});

test('P1/P2 completion does not manufacture assignment-due physical evidence without P3', () => {
  const evidence = record({ gates: [gate('p1'), gate('p2'), gate('p3', 'PENDING')] });
  assert.equal(evidence.checklistEligibility.physicalDevicePushEvidenceComplete, true);
  assert.equal(evidence.checklistEligibility.assignmentAssignedDuePhysicalEvidenceComplete, false);
});

test('P1/P3 completion does not satisfy physical push acceptance without disabled-path P2', () => {
  const evidence = record({ gates: [gate('p1'), gate('p2', 'PENDING'), gate('p3')] });
  assert.equal(evidence.checklistEligibility.physicalDevicePushEvidenceComplete, false);
  assert.equal(evidence.checklistEligibility.assignmentAssignedDuePhysicalEvidenceComplete, true);
});

test('PASS fails closed if any required physical sub-step or observation is missing', () => {
  const broken = gate('p1');
  broken.steps[0].checked = false;
  assert.throws(
    () => record({ gates: [broken, gate('p2'), gate('p3')] }),
    /P1 PASS requires every physical sub-step/,
  );

  const noNotes = gate('p2');
  noNotes.notes = 'short';
  assert.throws(
    () => record({ gates: [gate('p1'), noNotes, gate('p3')] }),
    /P2 PASS requires a concrete physical observation/,
  );
});

test('push evidence rejects an unapproved deployed origin', () => {
  assert.throws(
    () => record({ origin: 'https://attacker.example' }),
    /not an approved deployed BibleQuest/,
  );
});

test('evidence refuses cross-SHA sanitized state and expected-candidate mismatch', () => {
  assert.throws(
    () => record({ sanitizedSnapshot: snapshot({ candidate_sha: 'b'.repeat(40) }) }),
    /different candidate SHA/,
  );
  assert.throws(
    () => validatePhysicalPushEvidence(record(), 'c'.repeat(40)),
    /expected release-candidate SHA/,
  );
});

test('export picks only sanitized push state fields', () => {
  const evidence = record({
    sanitizedSnapshot: snapshot({
      user_id: 'must-not-survive',
      endpoint: 'https://push.example/secret',
      email: 'qa@example.com',
      token: 'secret',
    }),
  });
  const serialized = JSON.stringify(evidence);
  assert.equal(serialized.includes('must-not-survive'), false);
  assert.equal(serialized.includes('push.example'), false);
  assert.equal(serialized.includes('qa@example.com'), false);
  assert.equal(serialized.includes('"token"'), false);
});


test('evidence rejects obvious account identifiers, endpoints and credentials in human-entered fields', () => {
  assert.throws(
    () => record({
      metadata: {
        tester: 'qa@example.com',
        deviceOsBrowser: 'Android / Chrome',
        environment: 'preview',
        durableEvidenceReference: 'issue-452',
      },
    }),
    /account, credential, endpoint, key, or token material/i,
  );

  const p1 = gate('p1');
  p1.notes = 'Observed notification for user 11111111-1111-4111-8111-111111111111.';
  assert.throws(
    () => record({ gates: [p1, gate('p2'), gate('p3')] }),
    /account, credential, endpoint, key, or token material/i,
  );

  const p2 = gate('p2');
  p2.notes = 'endpoint=https://push.example/device-secret';
  assert.throws(
    () => record({ gates: [gate('p1'), p2, gate('p3')] }),
    /account, credential, endpoint, key, or token material/i,
  );
});


test('operator profiles distinguish physical push, assignment due and full field evidence', () => {
  const full = record();
  assert.equal(evaluatePhysicalPushEvidenceProfile(full, 'physical-push').satisfied, true);
  assert.equal(evaluatePhysicalPushEvidenceProfile(full, 'assignment-due').satisfied, true);
  assert.equal(evaluatePhysicalPushEvidenceProfile(full, 'full').satisfied, true);

  const noP3 = record({ gates: [gate('p1'), gate('p2'), gate('p3', 'PENDING')] });
  assert.equal(evaluatePhysicalPushEvidenceProfile(noP3, 'physical-push').satisfied, true);
  assert.equal(evaluatePhysicalPushEvidenceProfile(noP3, 'assignment-due').satisfied, false);
  assert.equal(evaluatePhysicalPushEvidenceProfile(noP3, 'full').satisfied, false);

  assert.throws(
    () => evaluatePhysicalPushEvidenceProfile(full, 'unknown'),
    /Unknown physical push evidence profile/,
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

import { evaluateAssignmentPushReadiness } from '../../scripts/v6-assignment-push-live-readiness.mjs';

const pinnedEvidence = JSON.parse(readFileSync(
  new URL('../../docs/v6/evidence/ASSIGNMENT_PUSH_LIVE_READINESS_20261002.json', import.meta.url),
  'utf8',
));

function snapshot(overrides = {}) {
  return {
    schemaVersion: 1,
    evidenceClass: 'TEST',
    edgeFunction: {
      slug: 'bq-assignment-reminders',
      status: 'ACTIVE',
      version: 1,
      verifyJwt: false,
      last24Hours: {
        http200: 288,
        httpNon2xx: 0,
      },
    },
    assignment_push_readiness: {
      schemaVersion: 1,
      observedAt: '2026-10-02T13:28:09.97186+00:00',
      extensions: { pgCron: true, pgNet: true },
      dueFunction: {
        exists: true,
        securityDefiner: true,
        serviceRoleExecute: true,
        authenticatedExecute: false,
        anonExecute: false,
        hasRetryReady: false,
      },
      indexes: { dueOnce: true, dueScan: true, retryDue: false },
      scheduler: { exists: true, schedule: '*/5 * * * *', active: true },
      vaultNames: { projectUrl: true, schedulerSecret: true },
      migrationHistory: {
        dueReminderCanonicalOrReviewedEquivalent: true,
        dueReminderCanonicalVersion: false,
        retryRedispatchCanonicalVersion: false,
      },
      last24Hours: {
        cronSucceeded: 268,
        cronFailed: 0,
        assignmentNotifications: 0,
        dueNotifications: 0,
        duePushDelivered: 0,
      },
      qaGap: { dueAssignmentsNow: 0 },
      ...overrides,
    },
  };
}

test('classifies the observed live backend as operational without overclaiming QA delivery or retry rollout', () => {
  const result = evaluateAssignmentPushReadiness(snapshot());
  assert.equal(result.backendReady, true);
  assert.equal(result.retryHardeningReady, false);
  assert.equal(result.schedulerDispatchReady, true);
  assert.equal(result.releaseBackendReady, false);
  assert.equal(result.liveDueDeliveryObserved, false);
  assert.equal(result.rowReadyForPass, false);
  assert.deepEqual(result.counts, {
    cronSucceeded24h: 268,
    cronFailed24h: 0,
    assignmentNotifications24h: 0,
    dueNotifications24h: 0,
    duePushDelivered24h: 0,
    dueAssignmentsNow: 0,
  });
  assert.ok(result.blockers.includes('retry:retryDueIndex'));
  assert.ok(result.blockers.includes('retry:retryFunctionPath'));
  assert.ok(result.blockers.includes('retry:retryMigrationRecorded'));
  assert.ok(result.blockers.includes('live:dueNotification'));
  assert.ok(result.blockers.includes('live:duePushDelivered'));
  assert.ok(result.blockers.includes('qa:noCurrentDueAssignment'));
});

test('accepts a reviewed equivalent due-reminder migration record without pretending it is the canonical version', () => {
  const result = evaluateAssignmentPushReadiness(snapshot({
    migrationHistory: {
      dueReminderCanonicalOrReviewedEquivalent: true,
      dueReminderCanonicalVersion: false,
      retryRedispatchCanonicalVersion: false,
    },
  }));
  assert.equal(result.backendReady, true);
  assert.equal(result.backendChecks.dueMigrationRecorded, true);
});

test('marks the row ready only after real due notification and delivered push evidence exist', () => {
  const result = evaluateAssignmentPushReadiness(snapshot({
    dueFunction: {
      exists: true,
      securityDefiner: true,
      serviceRoleExecute: true,
      authenticatedExecute: false,
      anonExecute: false,
      hasRetryReady: true,
    },
    indexes: { dueOnce: true, dueScan: true, retryDue: true },
    migrationHistory: {
      dueReminderCanonicalOrReviewedEquivalent: true,
      dueReminderCanonicalVersion: true,
      retryRedispatchCanonicalVersion: true,
    },
    last24Hours: {
      cronSucceeded: 288,
      cronFailed: 0,
      assignmentNotifications: 3,
      dueNotifications: 1,
      duePushDelivered: 1,
    },
    qaGap: { dueAssignmentsNow: 1 },
  }));
  assert.equal(result.backendReady, true);
  assert.equal(result.retryHardeningReady, true);
  assert.equal(result.schedulerDispatchReady, true);
  assert.equal(result.releaseBackendReady, true);
  assert.equal(result.liveDueDeliveryObserved, true);
  assert.equal(result.rowReadyForPass, true);
  assert.deepEqual(result.blockers, []);
});

test('fails closed for unsafe scheduler authority or cadence drift', () => {
  const result = evaluateAssignmentPushReadiness(snapshot({
    dueFunction: {
      exists: true,
      securityDefiner: true,
      serviceRoleExecute: true,
      authenticatedExecute: true,
      anonExecute: false,
      hasRetryReady: false,
    },
    scheduler: { exists: true, schedule: '* * * * *', active: true },
  }));
  assert.equal(result.backendReady, false);
  assert.ok(result.blockers.includes('backend:authenticatedDenied'));
  assert.ok(result.blockers.includes('backend:schedulerCadence'));
});

test('fails closed when actual Edge Function dispatch evidence is missing even if database and live-delivery counters look ready', () => {
  const candidate = snapshot({
    dueFunction: {
      exists: true,
      securityDefiner: true,
      serviceRoleExecute: true,
      authenticatedExecute: false,
      anonExecute: false,
      hasRetryReady: true,
    },
    indexes: { dueOnce: true, dueScan: true, retryDue: true },
    migrationHistory: {
      dueReminderCanonicalOrReviewedEquivalent: true,
      dueReminderCanonicalVersion: true,
      retryRedispatchCanonicalVersion: true,
    },
    last24Hours: {
      cronSucceeded: 288,
      cronFailed: 0,
      assignmentNotifications: 3,
      dueNotifications: 1,
      duePushDelivered: 1,
    },
    qaGap: { dueAssignmentsNow: 1 },
  });
  candidate.edgeFunction = null;

  const result = evaluateAssignmentPushReadiness(candidate);
  assert.equal(result.backendReady, true);
  assert.equal(result.retryHardeningReady, true);
  assert.equal(result.schedulerDispatchReady, false);
  assert.equal(result.releaseBackendReady, false);
  assert.equal(result.liveDueDeliveryObserved, true);
  assert.equal(result.rowReadyForPass, false);
  assert.ok(result.blockers.includes('dispatch:edgeFunctionActive'));
  assert.ok(result.blockers.includes('dispatch:edgeFunctionHttp200Observed'));
});

test('rejects malformed or negative readiness counts instead of manufacturing evidence', () => {
  assert.throws(() => evaluateAssignmentPushReadiness({ schemaVersion: 1 }), /missing extensions/i);
  assert.throws(() => evaluateAssignmentPushReadiness(snapshot({
    last24Hours: {
      cronSucceeded: -1,
      cronFailed: 0,
      assignmentNotifications: 0,
      dueNotifications: 0,
      duePushDelivered: 0,
    },
  })), /cronSucceeded must be a non-negative integer/i);
});


test('pinned 2026-10-02 live evidence proves backend health while preserving the real QA blocker', () => {
  assert.equal(pinnedEvidence.evidenceClass, 'LIVE-READ-ONLY');
  assert.equal(pinnedEvidence.edgeFunction.slug, 'bq-assignment-reminders');
  assert.equal(pinnedEvidence.edgeFunction.status, 'ACTIVE');
  const result = evaluateAssignmentPushReadiness(pinnedEvidence);
  assert.equal(result.backendReady, true);
  assert.equal(result.retryHardeningReady, false);
  assert.equal(result.schedulerDispatchReady, true);
  assert.equal(result.releaseBackendReady, false);
  assert.equal(result.liveDueDeliveryObserved, false);
  assert.equal(result.rowReadyForPass, false);
  assert.equal(result.counts.cronSucceeded24h, 283);
  assert.equal(result.counts.cronFailed24h, 0);
  assert.deepEqual(result.blockers, [
    'retry:retryDueIndex',
    'retry:retryFunctionPath',
    'retry:retryMigrationRecorded',
    'live:dueNotification',
    'live:duePushDelivered',
    'qa:noCurrentDueAssignment',
  ]);
});

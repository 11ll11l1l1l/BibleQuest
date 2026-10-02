import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED_SCHEDULE = '*/5 * * * *';

function integer(value) {
  return Number.isInteger(value) && value >= 0;
}

function malformed(message) {
  const error = new Error(message);
  error.code = 'BQ_ASSIGNMENT_PUSH_READINESS_INVALID';
  return error;
}

export function evaluateAssignmentPushReadiness(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    throw malformed('Assignment push readiness snapshot must be an object.');
  }
  if (snapshot.schemaVersion !== 1) {
    throw malformed('Assignment push readiness snapshot schemaVersion must be 1.');
  }

  const extensions = snapshot.extensions;
  const dueFunction = snapshot.dueFunction;
  const indexes = snapshot.indexes;
  const scheduler = snapshot.scheduler;
  const vaultNames = snapshot.vaultNames;
  const migrationHistory = snapshot.migrationHistory;
  const last24Hours = snapshot.last24Hours;
  const qaGap = snapshot.qaGap;

  for (const [name, value] of Object.entries({
    extensions,
    dueFunction,
    indexes,
    scheduler,
    vaultNames,
    migrationHistory,
    last24Hours,
    qaGap,
  })) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw malformed(`Assignment push readiness snapshot is missing ${name}.`);
    }
  }

  for (const [name, value] of Object.entries({
    cronSucceeded: last24Hours.cronSucceeded,
    cronFailed: last24Hours.cronFailed,
    assignmentNotifications: last24Hours.assignmentNotifications,
    dueNotifications: last24Hours.dueNotifications,
    duePushDelivered: last24Hours.duePushDelivered,
    dueAssignmentsNow: qaGap.dueAssignmentsNow,
  })) {
    if (!integer(value)) throw malformed(`Assignment push readiness count ${name} must be a non-negative integer.`);
  }

  const backendChecks = Object.freeze({
    pgCron: extensions.pgCron === true,
    pgNet: extensions.pgNet === true,
    dueFunctionExists: dueFunction.exists === true,
    dueFunctionSecurityDefiner: dueFunction.securityDefiner === true,
    serviceRoleExecute: dueFunction.serviceRoleExecute === true,
    authenticatedDenied: dueFunction.authenticatedExecute === false,
    anonDenied: dueFunction.anonExecute === false,
    dueOnceIndex: indexes.dueOnce === true,
    dueScanIndex: indexes.dueScan === true,
    schedulerExists: scheduler.exists === true,
    schedulerActive: scheduler.active === true,
    schedulerCadence: scheduler.schedule === EXPECTED_SCHEDULE,
    vaultProjectUrl: vaultNames.projectUrl === true,
    vaultSchedulerSecret: vaultNames.schedulerSecret === true,
    dueMigrationRecorded: migrationHistory.dueReminderCanonicalOrReviewedEquivalent === true,
    cronHealthy24h: last24Hours.cronSucceeded > 0 && last24Hours.cronFailed === 0,
  });

  const retryChecks = Object.freeze({
    retryDueIndex: indexes.retryDue === true,
    retryFunctionPath: dueFunction.hasRetryReady === true,
    retryMigrationRecorded: migrationHistory.retryRedispatchCanonicalVersion === true,
  });

  const backendReady = Object.values(backendChecks).every(Boolean);
  const retryHardeningReady = Object.values(retryChecks).every(Boolean);
  const liveDueNotificationObserved = last24Hours.dueNotifications > 0;
  const liveDuePushDelivered = last24Hours.duePushDelivered > 0;
  const liveDueDeliveryObserved = liveDueNotificationObserved && liveDuePushDelivered;
  const rowReadyForPass = backendReady && liveDueDeliveryObserved;

  const blockers = [];
  for (const [name, passed] of Object.entries(backendChecks)) {
    if (!passed) blockers.push(`backend:${name}`);
  }
  for (const [name, passed] of Object.entries(retryChecks)) {
    if (!passed) blockers.push(`retry:${name}`);
  }
  if (!liveDueNotificationObserved) blockers.push('live:dueNotification');
  if (!liveDuePushDelivered) blockers.push('live:duePushDelivered');
  if (qaGap.dueAssignmentsNow === 0 && !liveDueDeliveryObserved) blockers.push('qa:noCurrentDueAssignment');

  return Object.freeze({
    schemaVersion: 1,
    observedAt: typeof snapshot.observedAt === 'string' ? snapshot.observedAt : null,
    backendReady,
    retryHardeningReady,
    liveDueNotificationObserved,
    liveDuePushDelivered,
    liveDueDeliveryObserved,
    rowReadyForPass,
    counts: Object.freeze({
      cronSucceeded24h: last24Hours.cronSucceeded,
      cronFailed24h: last24Hours.cronFailed,
      assignmentNotifications24h: last24Hours.assignmentNotifications,
      dueNotifications24h: last24Hours.dueNotifications,
      duePushDelivered24h: last24Hours.duePushDelivered,
      dueAssignmentsNow: qaGap.dueAssignmentsNow,
    }),
    backendChecks,
    retryChecks,
    blockers: Object.freeze(blockers),
  });
}

async function main(argv) {
  if (argv.length !== 1) {
    throw new Error('Usage: node scripts/v6-assignment-push-live-readiness.mjs <snapshot.json>');
  }
  const input = JSON.parse(await readFile(resolve(argv[0]), 'utf8'));
  const snapshot = input.assignment_push_readiness ?? input.assignmentPushReadiness ?? input.readiness ?? input;
  const result = evaluateAssignmentPushReadiness(snapshot);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (!result.backendReady) process.exitCode = 2;
  else if (!result.rowReadyForPass) process.exitCode = 3;
}

const invokedAsCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsCli) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error?.stack || error);
    process.exitCode = 1;
  });
}

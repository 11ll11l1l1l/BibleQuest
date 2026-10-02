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

export function evaluateAssignmentPushReadiness(input) {
  const envelope = input
    && typeof input === 'object'
    && !Array.isArray(input)
    && Object.prototype.hasOwnProperty.call(input, 'assignment_push_readiness')
    ? input
    : null;
  const snapshot = envelope ? envelope.assignment_push_readiness : input;
  const edgeFunction = envelope?.edgeFunction ?? snapshot?.edgeFunction ?? null;

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

  const edgeHttp = edgeFunction?.last24Hours ?? null;
  if (edgeFunction !== null) {
    if (!edgeFunction || typeof edgeFunction !== 'object' || Array.isArray(edgeFunction)) {
      throw malformed('Assignment push readiness edgeFunction evidence must be an object.');
    }
    if (!edgeHttp || typeof edgeHttp !== 'object' || Array.isArray(edgeHttp)) {
      throw malformed('Assignment push readiness edgeFunction.last24Hours evidence is required.');
    }
    for (const [name, value] of Object.entries({
      http200: edgeHttp.http200,
      httpNon2xx: edgeHttp.httpNon2xx,
    })) {
      if (!integer(value)) throw malformed('Assignment push readiness edge count ' + name + ' must be a non-negative integer.');
    }
  }

  for (const [name, value] of Object.entries({
    cronSucceeded: last24Hours.cronSucceeded,
    cronFailed: last24Hours.cronFailed,
    assignmentNotifications: last24Hours.assignmentNotifications,
    assignedNotifications: last24Hours.assignedNotifications ?? 0,
    assignedPushDelivered: last24Hours.assignedPushDelivered ?? 0,
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
    retryMigrationRecorded:
      migrationHistory.retryRedispatchCanonicalOrReviewedEquivalent === true
      || migrationHistory.retryRedispatchCanonicalVersion === true,
  });

  const dispatchChecks = Object.freeze({
    edgeFunctionSlug: edgeFunction?.slug === 'bq-assignment-reminders',
    edgeFunctionActive: edgeFunction?.status === 'ACTIVE',
    edgeFunctionVersion: Number.isInteger(edgeFunction?.version) && edgeFunction.version > 0,
    schedulerAuthMode: edgeFunction?.verifyJwt === false,
    edgeFunctionHttp200Observed: integer(edgeHttp?.http200) && edgeHttp.http200 > 0,
    edgeFunctionNoHttpFailures: integer(edgeHttp?.httpNon2xx) && edgeHttp.httpNon2xx === 0,
  });

  const backendReady = Object.values(backendChecks).every(Boolean);
  const retryHardeningReady = Object.values(retryChecks).every(Boolean);
  const schedulerDispatchReady = Object.values(dispatchChecks).every(Boolean);
  const releaseBackendReady = backendReady && retryHardeningReady && schedulerDispatchReady;
  const liveAssignedNotificationObserved = (last24Hours.assignedNotifications ?? 0) > 0;
  const liveAssignedPushDelivered = (last24Hours.assignedPushDelivered ?? 0) > 0;
  const liveAssignedDeliveryObserved = liveAssignedNotificationObserved && liveAssignedPushDelivered;
  const liveDueNotificationObserved = last24Hours.dueNotifications > 0;
  const liveDuePushDelivered = last24Hours.duePushDelivered > 0;
  const liveDueDeliveryObserved = liveDueNotificationObserved && liveDuePushDelivered;
  const rowReadyForPass = releaseBackendReady && liveAssignedDeliveryObserved && liveDueDeliveryObserved;

  const blockers = [];
  for (const [name, passed] of Object.entries(backendChecks)) {
    if (!passed) blockers.push(`backend:${name}`);
  }
  for (const [name, passed] of Object.entries(retryChecks)) {
    if (!passed) blockers.push(`retry:${name}`);
  }
  for (const [name, passed] of Object.entries(dispatchChecks)) {
    if (!passed) blockers.push(`dispatch:${name}`);
  }
  if (!liveAssignedNotificationObserved) blockers.push('live:assignedNotification');
  if (!liveAssignedPushDelivered) blockers.push('live:assignedPushDelivered');
  if (!liveDueNotificationObserved) blockers.push('live:dueNotification');
  if (!liveDuePushDelivered) blockers.push('live:duePushDelivered');
  if (qaGap.dueAssignmentsNow === 0 && !liveDueDeliveryObserved) blockers.push('qa:noCurrentDueAssignment');

  return Object.freeze({
    schemaVersion: 1,
    observedAt: typeof snapshot.observedAt === 'string' ? snapshot.observedAt : null,
    backendReady,
    retryHardeningReady,
    schedulerDispatchReady,
    releaseBackendReady,
    liveAssignedNotificationObserved,
    liveAssignedPushDelivered,
    liveAssignedDeliveryObserved,
    liveDueNotificationObserved,
    liveDuePushDelivered,
    liveDueDeliveryObserved,
    rowReadyForPass,
    counts: Object.freeze({
      cronSucceeded24h: last24Hours.cronSucceeded,
      cronFailed24h: last24Hours.cronFailed,
      assignmentNotifications24h: last24Hours.assignmentNotifications,
      assignedNotifications24h: last24Hours.assignedNotifications ?? 0,
      assignedPushDelivered24h: last24Hours.assignedPushDelivered ?? 0,
      dueNotifications24h: last24Hours.dueNotifications,
      duePushDelivered24h: last24Hours.duePushDelivered,
      dueAssignmentsNow: qaGap.dueAssignmentsNow,
    }),
    backendChecks,
    retryChecks,
    dispatchChecks,
    blockers: Object.freeze(blockers),
  });
}

async function main(argv) {
  if (argv.length !== 1) {
    throw new Error('Usage: node scripts/v6-assignment-push-live-readiness.mjs <snapshot.json>');
  }
  const input = JSON.parse(await readFile(resolve(argv[0]), 'utf8'));
  const result = evaluateAssignmentPushReadiness(input);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (!result.backendReady) process.exitCode = 2;
  else if (!result.retryHardeningReady) process.exitCode = 3;
  else if (!result.schedulerDispatchReady) process.exitCode = 4;
  else if (!result.liveAssignedDeliveryObserved || !result.liveDueDeliveryObserved) process.exitCode = 5;
}

const invokedAsCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsCli) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error?.stack || error);
    process.exitCode = 1;
  });
}

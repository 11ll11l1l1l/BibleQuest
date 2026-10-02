import {
  assertDeclaredEligibility,
  evidenceText,
  normalizePhysicalGateSet,
  requireEvidenceMetadata,
  requireEvidenceTimestamp,
  requireExactCandidateSha,
} from './physical-device-evidence.js';

export const PUSH_FIELD_GATE_STEPS = Object.freeze({
  p1: Object.freeze(['enabled-ready','app-closed','os-notification-arrived','opened-assignments','durable-notification-center']),
  p2: Object.freeze(['disabled-ready','app-closed','no-os-push-90s','notification-center-fallback']),
  p3: Object.freeze(['backend-ready','app-closed','due-notification-once','os-notification-arrived','opened-assignments','no-duplicate-next-interval']),
});

function sanitizedState(snapshot, candidateSha) {
  const snapshotSha = requireExactCandidateSha(snapshot?.candidate_sha, 'Sanitized push status');
  if (snapshotSha !== candidateSha) throw new Error('Sanitized push status belongs to a different candidate SHA.');
  const permission = evidenceText(snapshot?.notification_permission) || 'unsupported';
  if (!['granted','denied','default','unsupported'].includes(permission)) {
    throw new Error('Sanitized push status has an invalid notification permission.');
  }
  return Object.freeze({
    candidateSha: snapshotSha,
    authenticated: snapshot?.authenticated === true,
    pushSupported: snapshot?.push_supported === true,
    notificationPermission: permission,
    serviceWorkerActive: snapshot?.service_worker_active === true,
    browserSubscriptionPresent: snapshot?.browser_subscription_present === true,
    ownerMarkerMatchesCurrentAccount: snapshot?.owner_marker_matches_current_account === true,
    lifecyclePersistenceVerifiedThisSession: snapshot?.lifecycle_persistence_verified_this_session === true,
  });
}

export function buildPhysicalPushEvidence({candidateSha,metadata,gates,sanitizedSnapshot,observedAt=new Date().toISOString()}={}) {
  const sha = requireExactCandidateSha(candidateSha, 'Physical push evidence');
  const normalizedMetadata = requireEvidenceMetadata(metadata, 'Physical push evidence');
  const normalizedGates = normalizePhysicalGateSet(gates, PUSH_FIELD_GATE_STEPS, 'Physical push evidence');
  const state = sanitizedState(sanitizedSnapshot, sha);
  const observed = requireEvidenceTimestamp(observedAt);
  const gateStatus = Object.fromEntries(normalizedGates.map(gate => [gate.id, gate.status]));
  const physicalDevicePushEvidenceComplete = gateStatus.p1 === 'PASS' && gateStatus.p2 === 'PASS';
  const assignmentAssignedDuePhysicalEvidenceComplete = gateStatus.p1 === 'PASS' && gateStatus.p3 === 'PASS';
  return Object.freeze({
    schemaVersion:1,evidenceClass:'PHYSICAL-DEVICE',evidenceType:'PUSH',candidateSha:sha,observedAt:observed,
    ...normalizedMetadata,
    sanitizedPushStateAtExport:state,
    gates:normalizedGates,
    checklistEligibility:Object.freeze({
      physicalDevicePushEvidenceComplete,
      assignmentAssignedDuePhysicalEvidenceComplete,
      aggregatePushStillRequiresBuiltBrowserEvidence:true,
    }),
  });
}

export function validatePhysicalPushEvidence(record, expectedCandidateSha) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Physical push evidence must be a JSON object.');
  if (record.schemaVersion !== 1) throw new Error('Physical push evidence schemaVersion must be 1.');
  if (record.evidenceClass !== 'PHYSICAL-DEVICE') throw new Error('Physical push evidence class must be PHYSICAL-DEVICE.');
  if (record.evidenceType != null && record.evidenceType !== 'PUSH') throw new Error('Physical push evidence type must be PUSH.');
  const rebuilt = buildPhysicalPushEvidence({
    candidateSha:record.candidateSha,
    metadata:{tester:record.tester,deviceOsBrowser:record.deviceOsBrowser,environment:record.environment,durableEvidenceReference:record.durableEvidenceReference},
    gates:record.gates,
    sanitizedSnapshot:{
      candidate_sha:record.sanitizedPushStateAtExport?.candidateSha,
      authenticated:record.sanitizedPushStateAtExport?.authenticated,
      push_supported:record.sanitizedPushStateAtExport?.pushSupported,
      notification_permission:record.sanitizedPushStateAtExport?.notificationPermission,
      service_worker_active:record.sanitizedPushStateAtExport?.serviceWorkerActive,
      browser_subscription_present:record.sanitizedPushStateAtExport?.browserSubscriptionPresent,
      owner_marker_matches_current_account:record.sanitizedPushStateAtExport?.ownerMarkerMatchesCurrentAccount,
      lifecycle_persistence_verified_this_session:record.sanitizedPushStateAtExport?.lifecyclePersistenceVerifiedThisSession,
    },
    observedAt:record.observedAt,
  });
  if (expectedCandidateSha && rebuilt.candidateSha !== requireExactCandidateSha(expectedCandidateSha,'Expected release candidate')) {
    throw new Error('Physical push evidence does not match the expected release-candidate SHA.');
  }
  const declared=record.checklistEligibility||{};
  assertDeclaredEligibility(declared,'physicalDevicePushEvidenceComplete',rebuilt.checklistEligibility.physicalDevicePushEvidenceComplete,'physical push');
  assertDeclaredEligibility(declared,'assignmentAssignedDuePhysicalEvidenceComplete',rebuilt.checklistEligibility.assignmentAssignedDuePhysicalEvidenceComplete,'assignment-due physical');
  assertDeclaredEligibility(declared,'aggregatePushStillRequiresBuiltBrowserEvidence',true,'aggregate push external dependency');
  return rebuilt;
}

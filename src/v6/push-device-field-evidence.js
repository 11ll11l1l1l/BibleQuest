const SHA_PATTERN = /^[0-9a-f]{40}$/i;

export const PUSH_FIELD_GATE_STEPS = Object.freeze({
  p1: Object.freeze([
    'enabled-ready',
    'app-closed',
    'os-notification-arrived',
    'opened-assignments',
    'durable-notification-center',
  ]),
  p2: Object.freeze([
    'disabled-ready',
    'app-closed',
    'no-os-push-90s',
    'notification-center-fallback',
  ]),
  p3: Object.freeze([
    'backend-ready',
    'app-closed',
    'due-notification-once',
    'os-notification-arrived',
    'opened-assignments',
    'no-duplicate-next-interval',
  ]),
});

function text(value) {
  return String(value ?? '').trim();
}

const SENSITIVE_TEXT_PATTERNS = Object.freeze([
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
  /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/,
  /\bsb_secret_[A-Za-z0-9_-]+\b/i,
  /\bservice_role\b/i,
  /\bp256dh\b/i,
  /\b(?:password|endpoint|auth(?:entication)?\s*token)\s*[:=]/i,
]);

function sanitizedText(value, label) {
  const normalized = text(value);
  if (SENSITIVE_TEXT_PATTERNS.some(pattern => pattern.test(normalized))) {
    throw new Error(label + ' contains account, credential, endpoint, key, or token material.');
  }
  return normalized;
}

function exactSha(value) {
  const sha = text(value).toLowerCase();
  if (!SHA_PATTERN.test(sha)) throw new Error('Physical push evidence requires an exact 40-character candidate SHA.');
  return sha;
}

function requiredMetadata(metadata) {
  const tester = sanitizedText(metadata?.tester, 'Tester metadata');
  const deviceOsBrowser = sanitizedText(metadata?.deviceOsBrowser, 'Device metadata');
  const environment = sanitizedText(metadata?.environment, 'Environment metadata');
  const durableEvidenceReference = sanitizedText(metadata?.durableEvidenceReference, 'Evidence reference');
  if (!tester) throw new Error('Physical push evidence requires a tester or QA identifier.');
  if (!deviceOsBrowser) throw new Error('Physical push evidence requires device / OS / browser metadata.');
  if (!environment) throw new Error('Physical push evidence requires an environment label.');
  if (!durableEvidenceReference) throw new Error('Physical push evidence requires a durable evidence reference.');
  return Object.freeze({ tester, deviceOsBrowser, environment, durableEvidenceReference });
}

function normalizeGate(gate) {
  const id = text(gate?.id).toLowerCase();
  const expected = PUSH_FIELD_GATE_STEPS[id];
  if (!expected) throw new Error('Unknown physical push evidence gate: ' + (id || 'missing') + '.');
  const status = text(gate?.status).toUpperCase();
  if (!['PENDING', 'PASS', 'FAIL'].includes(status)) {
    throw new Error(id.toUpperCase() + ' has an invalid evidence status.');
  }
  const notes = sanitizedText(gate?.notes, id.toUpperCase() + ' observation');
  const steps = Array.isArray(gate?.steps) ? gate.steps : [];
  const seen = new Map();
  for (const step of steps) {
    const stepId = text(step?.id);
    if (!expected.includes(stepId) || seen.has(stepId)) {
      throw new Error(id.toUpperCase() + ' has an invalid or duplicate physical sub-step.');
    }
    seen.set(stepId, step?.checked === true);
  }
  const normalizedSteps = expected.map(stepId => Object.freeze({
    id: stepId,
    checked: seen.get(stepId) === true,
  }));
  if (status === 'PASS') {
    if (normalizedSteps.some(step => !step.checked)) {
      throw new Error(id.toUpperCase() + ' PASS requires every physical sub-step.');
    }
    if (notes.length < 12) {
      throw new Error(id.toUpperCase() + ' PASS requires a concrete physical observation.');
    }
  }
  return Object.freeze({ id, status, notes, steps: Object.freeze(normalizedSteps) });
}

function sanitizedState(snapshot, candidateSha) {
  const snapshotSha = exactSha(snapshot?.candidate_sha);
  if (snapshotSha !== candidateSha) {
    throw new Error('Sanitized push status belongs to a different candidate SHA.');
  }
  const permission = text(snapshot?.notification_permission) || 'unsupported';
  if (!['granted', 'denied', 'default', 'unsupported'].includes(permission)) {
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

export function buildPhysicalPushEvidence({
  candidateSha,
  metadata,
  gates,
  sanitizedSnapshot,
  observedAt = new Date().toISOString(),
} = {}) {
  const sha = exactSha(candidateSha);
  const normalizedMetadata = requiredMetadata(metadata);
  if (!Array.isArray(gates)) throw new Error('Physical push evidence gates are required.');
  const normalizedGates = gates.map(normalizeGate);
  if (normalizedGates.length !== 3 || new Set(normalizedGates.map(gate => gate.id)).size !== 3) {
    throw new Error('Physical push evidence requires exactly P1, P2 and P3 gate records.');
  }
  for (const id of Object.keys(PUSH_FIELD_GATE_STEPS)) {
    if (!normalizedGates.some(gate => gate.id === id)) {
      throw new Error('Physical push evidence is missing ' + id.toUpperCase() + '.');
    }
  }
  const state = sanitizedState(sanitizedSnapshot, sha);
  const gateStatus = Object.fromEntries(normalizedGates.map(gate => [gate.id, gate.status]));
  const physicalDevicePushEvidenceComplete = gateStatus.p1 === 'PASS' && gateStatus.p2 === 'PASS';
  const assignmentAssignedDuePhysicalEvidenceComplete = gateStatus.p1 === 'PASS' && gateStatus.p3 === 'PASS';

  return Object.freeze({
    schemaVersion: 1,
    evidenceClass: 'PHYSICAL-DEVICE',
    candidateSha: sha,
    observedAt: text(observedAt),
    ...normalizedMetadata,
    sanitizedPushStateAtExport: state,
    gates: Object.freeze(normalizedGates),
    checklistEligibility: Object.freeze({
      physicalDevicePushEvidenceComplete,
      assignmentAssignedDuePhysicalEvidenceComplete,
      aggregatePushStillRequiresBuiltBrowserEvidence: true,
    }),
  });
}

export function validatePhysicalPushEvidence(record, expectedCandidateSha) {
  const rebuilt = buildPhysicalPushEvidence({
    candidateSha: record?.candidateSha,
    metadata: {
      tester: record?.tester,
      deviceOsBrowser: record?.deviceOsBrowser,
      environment: record?.environment,
      durableEvidenceReference: record?.durableEvidenceReference,
    },
    gates: record?.gates,
    sanitizedSnapshot: {
      candidate_sha: record?.sanitizedPushStateAtExport?.candidateSha,
      authenticated: record?.sanitizedPushStateAtExport?.authenticated,
      push_supported: record?.sanitizedPushStateAtExport?.pushSupported,
      notification_permission: record?.sanitizedPushStateAtExport?.notificationPermission,
      service_worker_active: record?.sanitizedPushStateAtExport?.serviceWorkerActive,
      browser_subscription_present: record?.sanitizedPushStateAtExport?.browserSubscriptionPresent,
      owner_marker_matches_current_account: record?.sanitizedPushStateAtExport?.ownerMarkerMatchesCurrentAccount,
      lifecycle_persistence_verified_this_session: record?.sanitizedPushStateAtExport?.lifecyclePersistenceVerifiedThisSession,
    },
    observedAt: record?.observedAt,
  });
  if (expectedCandidateSha && rebuilt.candidateSha !== exactSha(expectedCandidateSha)) {
    throw new Error('Physical push evidence does not match the expected release-candidate SHA.');
  }
  return rebuilt;
}

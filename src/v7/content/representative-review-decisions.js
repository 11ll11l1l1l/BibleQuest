const OUTCOMES = new Set(['approved', 'rejected']);
const CHECK_RESULTS = new Set(['pass', 'fail']);

export class V7RepresentativeReviewDecisionError extends Error {
  constructor(code, path, message) {
    super(`${path}: ${message}`);
    this.name = 'V7RepresentativeReviewDecisionError';
    this.code = code;
    this.path = path;
  }
}

function reject(code, path, message) {
  throw new V7RepresentativeReviewDecisionError(code, path, message);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function rejectUnknownFields(record, fields, path) {
  const allowed = new Set(fields);
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) reject('unknown_field', `${path}.${key}`, 'is not supported by review decision schema version 1');
  }
}

function requiredString(value, path) {
  if (typeof value !== 'string' || !value.trim()) reject('required', path, 'must be a non-empty string');
  return value.trim();
}

function optionalString(value, path) {
  if (value === undefined || value === null || value === '') return undefined;
  return requiredString(value, path);
}

function requiredTimestamp(value, path) {
  const timestamp = requiredString(value, path);
  if (!Number.isFinite(Date.parse(timestamp))) reject('timestamp', path, 'must be a valid date/time');
  return timestamp;
}

function validateEvidenceRefs(value, packetItem, path) {
  if (!Array.isArray(value) || !value.length) reject('evidence_refs', path, 'must be a non-empty array');
  const refs = value.map((ref, index) => requiredString(ref, `${path}[${index}]`));
  if (new Set(refs).size !== refs.length) reject('evidence_refs', path, 'must not contain duplicates');

  for (const requiredRef of packetItem.repositoryEvidenceRefs) {
    if (!refs.includes(requiredRef)) {
      reject('evidence_refs', path, `must retain required repository evidence ${requiredRef}`);
    }
  }

  return Object.freeze(refs);
}

function validateChecks(value, packetItem, path) {
  if (!Array.isArray(value)) reject('checks', path, 'must be an array');
  const requiredIds = packetItem.requiredChecks;
  if (value.length !== requiredIds.length) reject('checks', path, 'must cover every required review check exactly once');

  const byId = new Map();
  for (const [index, check] of value.entries()) {
    const checkPath = `${path}[${index}]`;
    if (!isRecord(check)) reject('check', checkPath, 'must be an object');
    rejectUnknownFields(check, ['id', 'result', 'note'], checkPath);
    const id = requiredString(check.id, `${checkPath}.id`);
    if (!requiredIds.includes(id)) reject('check_id', `${checkPath}.id`, `is not required for ${packetItem.contentType}`);
    if (byId.has(id)) reject('duplicate_check', `${checkPath}.id`, `duplicates ${id}`);
    if (!CHECK_RESULTS.has(check.result)) reject('check_result', `${checkPath}.result`, 'must be pass or fail');
    const note = optionalString(check.note, `${checkPath}.note`);
    byId.set(id, Object.freeze({ id, result: check.result, ...(note ? { note } : {}) }));
  }

  for (const requiredId of requiredIds) {
    if (!byId.has(requiredId)) reject('checks', path, `is missing required check ${requiredId}`);
  }

  return Object.freeze(requiredIds.map(id => byId.get(id)));
}

function validateCanonicalDecisionParity(canonicalItem, decision, path) {
  const reviewStatus = canonicalItem.review.status;
  const hasFinalReview = reviewStatus === 'approved' || reviewStatus === 'rejected';

  if (!hasFinalReview) {
    if (decision) {
      reject('canonical_review_mismatch', path, `decision ${decision.outcome} requires the canonical review state to be updated atomically`);
    }
    return;
  }

  if (!decision) {
    reject('missing_decision', path, `canonical review status ${reviewStatus} requires a matching authorized decision record`);
  }
  if (decision.outcome !== reviewStatus) {
    reject('canonical_review_mismatch', path, `canonical review status ${reviewStatus} does not match decision outcome ${decision.outcome}`);
  }

  const reviewer = requiredString(canonicalItem.review.reviewer, `${path}.review.reviewer`);
  const decidedAt = requiredTimestamp(canonicalItem.review.decidedAt, `${path}.review.decidedAt`);
  if (reviewer !== decision.reviewer) {
    reject('canonical_reviewer_mismatch', `${path}.review.reviewer`, 'must match the authorized decision record reviewer');
  }
  if (decidedAt !== decision.decidedAt) {
    reject('canonical_decision_time_mismatch', `${path}.review.decidedAt`, 'must match the authorized decision record timestamp');
  }
}

export function validateRepresentativeReviewDecision(decision, canonicalItem, packetItem, path = 'decision') {
  if (!isRecord(decision)) reject('decision', path, 'must be an object');
  rejectUnknownFields(decision, [
    'schemaVersion',
    'itemId',
    'revision',
    'outcome',
    'reviewer',
    'decidedAt',
    'rightsStatusSnapshot',
    'evidenceRefs',
    'checks',
    'note'
  ], path);

  if (decision.schemaVersion !== 1) reject('schema_version', `${path}.schemaVersion`, 'must be 1');
  if (!canonicalItem || !packetItem) reject('review_target', path, 'must resolve to current canonical and review-packet items');

  const itemId = requiredString(decision.itemId, `${path}.itemId`);
  if (itemId !== canonicalItem.id || itemId !== packetItem.itemId) {
    reject('item_id', `${path}.itemId`, 'must identify the same canonical and review-packet item');
  }

  const revision = requiredString(decision.revision, `${path}.revision`);
  if (revision !== canonicalItem.revision || revision !== packetItem.revisionSnapshot) {
    reject('revision', `${path}.revision`, 'must identify the current reviewed revision');
  }

  if (!OUTCOMES.has(decision.outcome)) reject('outcome', `${path}.outcome`, 'must be approved or rejected');
  const reviewer = requiredString(decision.reviewer, `${path}.reviewer`);
  const decidedAt = requiredTimestamp(decision.decidedAt, `${path}.decidedAt`);
  const rightsStatusSnapshot = requiredString(decision.rightsStatusSnapshot, `${path}.rightsStatusSnapshot`);
  if (rightsStatusSnapshot !== canonicalItem.rights.status || rightsStatusSnapshot !== packetItem.rightsStatusSnapshot) {
    reject('rights_snapshot', `${path}.rightsStatusSnapshot`, 'must match the current canonical and review-packet rights status');
  }

  const evidenceRefs = validateEvidenceRefs(decision.evidenceRefs, packetItem, `${path}.evidenceRefs`);
  const checks = validateChecks(decision.checks, packetItem, `${path}.checks`);
  const failedChecks = checks.filter(check => check.result === 'fail');

  if (decision.outcome === 'approved') {
    if (canonicalItem.rights.status !== 'verified') {
      reject('rights_not_verified', `${path}.outcome`, 'approval is not permitted while canonical rights remain unverified');
    }
    if (failedChecks.length) reject('approval_failed_check', `${path}.checks`, 'approved decisions require every required check to pass');
  } else if (!failedChecks.length) {
    reject('rejection_without_failure', `${path}.checks`, 'rejected decisions require at least one failed review check');
  }

  const note = optionalString(decision.note, `${path}.note`);
  return Object.freeze({
    schemaVersion: 1,
    itemId,
    revision,
    outcome: decision.outcome,
    reviewer,
    decidedAt,
    rightsStatusSnapshot,
    evidenceRefs,
    checks,
    ...(note ? { note } : {})
  });
}

export function validateRepresentativeReviewDecisionLedger(ledger, canonicalItems, reviewPacket) {
  if (!isRecord(ledger)) reject('ledger', 'ledger', 'must be an object');
  rejectUnknownFields(ledger, ['schemaVersion', 'scope', 'status', 'boundary', 'decisions'], 'ledger');
  if (ledger.schemaVersion !== 1) reject('schema_version', 'ledger.schemaVersion', 'must be 1');
  if (ledger.scope !== 'v7_representative_library_review_decisions') {
    reject('scope', 'ledger.scope', 'must identify the bounded representative Library review-decision scope');
  }
  if (!isRecord(ledger.boundary)) reject('boundary', 'ledger.boundary', 'must be an object');
  rejectUnknownFields(ledger.boundary, [
    'doesNotApproveByPresence',
    'doesNotPublishContent',
    'doesNotChangeRights',
    'authorizedReviewerRequired'
  ], 'ledger.boundary');
  for (const key of ['doesNotApproveByPresence', 'doesNotPublishContent', 'doesNotChangeRights']) {
    if (ledger.boundary[key] !== true) reject('boundary', `ledger.boundary.${key}`, 'must remain true');
  }
  if (ledger.boundary.authorizedReviewerRequired !== undefined
      && typeof ledger.boundary.authorizedReviewerRequired !== 'boolean') {
    reject('boundary', 'ledger.boundary.authorizedReviewerRequired', 'must be boolean when retained for legacy representative-review compatibility');
  }
  if (!Array.isArray(ledger.decisions)) reject('decisions', 'ledger.decisions', 'must be an array');

  const canonicalById = new Map(canonicalItems.map(item => [item.id, item]));
  const packetById = new Map(reviewPacket.items.map(item => [item.itemId, item]));
  const seen = new Set();
  const decisions = ledger.decisions.map((decision, index) => {
    const itemId = isRecord(decision) ? decision.itemId : undefined;
    const canonicalItem = canonicalById.get(itemId);
    const packetItem = packetById.get(itemId);
    const normalized = validateRepresentativeReviewDecision(decision, canonicalItem, packetItem, `ledger.decisions[${index}]`);
    const key = `${normalized.itemId}@${normalized.revision}`;
    if (seen.has(key)) reject('duplicate_decision', `ledger.decisions[${index}]`, `duplicates ${key}`);
    seen.add(key);
    return normalized;
  });

  const decisionById = new Map(decisions.map(decision => [decision.itemId, decision]));
  for (const packetItem of reviewPacket.items) {
    const canonicalItem = canonicalById.get(packetItem.itemId);
    if (!canonicalItem) reject('review_target', `canonical.${packetItem.itemId}`, 'is missing from the representative content inventory');
    validateCanonicalDecisionParity(canonicalItem, decisionById.get(packetItem.itemId), `canonical.${packetItem.itemId}`);
  }

  const expectedStatus = decisions.length === 0
    ? 'awaiting_authorized_decisions'
    : decisions.length === reviewPacket.items.length
      ? 'complete_authorized_decisions'
      : 'partial_authorized_decisions';
  if (ledger.status !== expectedStatus) reject('status', 'ledger.status', `must be ${expectedStatus} for the current decision count`);

  return Object.freeze({
    schemaVersion: 1,
    scope: ledger.scope,
    status: ledger.status,
    boundary: Object.freeze({ ...ledger.boundary }),
    decisions: Object.freeze(decisions)
  });
}

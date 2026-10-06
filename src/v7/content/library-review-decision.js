const REVIEWER_TYPES = new Set(['automated_policy', 'human']);
const HUMAN_OUTCOMES = new Set(['approved', 'request_changes', 'rejected']);
const AUTOMATED_OUTCOMES = new Set(['auto_approved', 'needs_repair', 'rejected']);
const CONTENT_TYPES = new Set(['book', 'devotional', 'past_teaching']);
const CRITERION_RESULTS = new Set(['pass', 'fail', 'unknown']);

function clean(value) {
  return String(value ?? '').trim();
}

function timestamp(value, label) {
  const text = clean(value);
  if (!text || !Number.isFinite(Date.parse(text))) throw new TypeError(`${label} must be a valid timestamp`);
  return new Date(text).toISOString();
}

function refs(value, label, { required = false } = {}) {
  if (value == null && !required) return Object.freeze([]);
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  const rows = value.map(clean);
  if (rows.some(row => !row)) throw new TypeError(`${label} cannot contain empty values`);
  if (required && rows.length === 0) throw new TypeError(`${label} must contain evidence`);
  if (new Set(rows).size !== rows.length) throw new TypeError(`${label} cannot contain duplicates`);
  return Object.freeze(rows);
}

function automatedSecondPass(value, revision, normalizedCriteria, outcome) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('automated decisions require secondPass');
  const result = clean(value.result);
  if (!CRITERION_RESULTS.has(result)) throw new TypeError('secondPass.result is invalid');
  const evaluator = clean(value.evaluator);
  if (!evaluator) throw new TypeError('secondPass.evaluator is required');
  const evaluatedAt = timestamp(value.evaluatedAt, 'secondPass.evaluatedAt');
  const evaluatedRevision = clean(value.revision);
  if (!evaluatedRevision) throw new TypeError('secondPass.revision is required');
  const evidenceRefs = refs(value.evidenceRefs, 'secondPass.evidenceRefs', { required: result !== 'unknown' });
  const note = clean(value.note);
  if (outcome === 'auto_approved') {
    if (result !== 'pass') throw new TypeError('auto-approved decisions require a passing secondPass');
    if (evaluatedRevision !== revision) throw new TypeError('auto-approved decisions require secondPass revision parity');
    if (normalizedCriteria.some(row => row.result !== 'pass')) throw new TypeError('auto-approved decisions require every criterion to pass');
    if (normalizedCriteria.some(row => row.evaluator === evaluator)) throw new TypeError('auto-approved decisions require an independent secondPass evaluator');
  }
  return Object.freeze({
    result,
    evaluator,
    evaluatedAt,
    revision: evaluatedRevision,
    evidenceRefs,
    ...(note ? { note } : {})
  });
}

function criteria(value, reviewerType) {
  if (value == null && reviewerType === 'human') return Object.freeze([]);
  if (!Array.isArray(value)) throw new TypeError('criteria must be an array');
  if (reviewerType === 'automated_policy' && value.length === 0) throw new TypeError('automated decisions require criteria');
  const seen = new Set();
  return Object.freeze(value.map((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new TypeError(`criteria[${index}] must be an object`);
    const id = clean(row.id);
    if (!id) throw new TypeError(`criteria[${index}].id is required`);
    if (seen.has(id)) throw new TypeError(`criteria contains duplicate ${id}`);
    seen.add(id);
    const result = clean(row.result);
    if (!CRITERION_RESULTS.has(result)) throw new TypeError(`criteria[${index}].result is invalid`);
    const evaluator = clean(row.evaluator);
    if (reviewerType === 'automated_policy' && !evaluator) throw new TypeError(`criteria[${index}].evaluator is required`);
    const evidenceRefs = refs(row.evidenceRefs, `criteria[${index}].evidenceRefs`, { required: result !== 'unknown' });
    const evaluatedAt = row.evaluatedAt == null && reviewerType === 'human'
      ? null
      : timestamp(row.evaluatedAt, `criteria[${index}].evaluatedAt`);
    const note = clean(row.note);
    return Object.freeze({
      id,
      result,
      evidenceRefs,
      ...(evaluator ? { evaluator } : {}),
      ...(evaluatedAt ? { evaluatedAt } : {}),
      ...(typeof row.hard === 'boolean' ? { hard: row.hard } : {}),
      ...(note ? { note } : {})
    });
  }));
}

export function validateV7LibraryReviewDecision(decision) {
  if (!decision || typeof decision !== 'object' || Array.isArray(decision)) throw new TypeError('decision is required');
  if (decision.schemaVersion !== 1) throw new TypeError('decision.schemaVersion must be 1');

  const itemId = clean(decision.itemId);
  const revision = clean(decision.revision);
  const contentType = clean(decision.contentType);
  const reviewerType = clean(decision.reviewerType);
  const outcome = clean(decision.outcome);
  if (!itemId) throw new TypeError('decision.itemId is required');
  if (!revision) throw new TypeError('decision.revision is required');
  if (!CONTENT_TYPES.has(contentType)) throw new TypeError('decision.contentType is invalid');
  if (!REVIEWER_TYPES.has(reviewerType)) throw new TypeError('decision.reviewerType is invalid');

  const decidedAt = timestamp(decision.decidedAt, 'decision.decidedAt');
  const evidenceRefs = refs(decision.evidenceRefs, 'decision.evidenceRefs');
  const normalizedCriteria = criteria(decision.criteria, reviewerType);
  const note = clean(decision.note);

  if (reviewerType === 'automated_policy') {
    if (!AUTOMATED_OUTCOMES.has(outcome)) throw new TypeError('automated decision outcome is invalid');
    const policyId = clean(decision.policyId);
    const policyVersion = clean(decision.policyVersion);
    if (!policyId) throw new TypeError('automated decision policyId is required');
    if (!policyVersion) throw new TypeError('automated decision policyVersion is required');
    if (clean(decision.reviewerId)) throw new TypeError('automated decisions must not impersonate a human reviewer');
    const normalizedSecondPass = automatedSecondPass(decision.secondPass, revision, normalizedCriteria, outcome);

    return Object.freeze({
      schemaVersion: 1,
      itemId,
      revision,
      contentType,
      reviewerType,
      outcome,
      policyId,
      policyVersion,
      decidedAt,
      evidenceRefs,
      criteria: normalizedCriteria,
      secondPass: normalizedSecondPass,
      ...(note ? { note } : {})
    });
  }

  if (decision.secondPass !== undefined && decision.secondPass !== null) throw new TypeError('human decisions must not claim an automated secondPass');
  if (!HUMAN_OUTCOMES.has(outcome)) throw new TypeError('human decision outcome is invalid');
  const reviewerId = clean(decision.reviewerId);
  if (!reviewerId) throw new TypeError('human decision reviewerId is required');
  if (clean(decision.policyId) || clean(decision.policyVersion)) {
    throw new TypeError('human decisions must not claim automated policy identity');
  }

  return Object.freeze({
    schemaVersion: 1,
    itemId,
    revision,
    contentType,
    reviewerType,
    outcome,
    reviewerId,
    decidedAt,
    evidenceRefs,
    criteria: normalizedCriteria,
    ...(note ? { note } : {})
  });
}

export function createV7LibraryHumanOverride({
  itemId,
  revision,
  contentType,
  outcome,
  reviewerId,
  decidedAt = new Date().toISOString(),
  evidenceRefs = [],
  criteria = [],
  note = ''
} = {}) {
  return validateV7LibraryReviewDecision({
    schemaVersion: 1,
    itemId,
    revision,
    contentType,
    reviewerType: 'human',
    outcome,
    reviewerId,
    decidedAt,
    evidenceRefs,
    criteria,
    note
  });
}

export function normalizeV7AutomatedPolicyDecision(policyDecision) {
  if (!policyDecision || policyDecision.reviewerType !== 'automated_policy') {
    throw new TypeError('policyDecision must be an automated policy decision');
  }
  const evidenceRefs = [...new Set([
    ...(policyDecision.criteria || []).flatMap(row => row.evidenceRefs || []),
    ...(policyDecision.secondPass?.evidenceRefs || [])
  ])];

  return validateV7LibraryReviewDecision({
    schemaVersion: 1,
    itemId: policyDecision.itemId,
    revision: policyDecision.revision,
    contentType: policyDecision.contentType,
    reviewerType: 'automated_policy',
    outcome: policyDecision.outcome,
    policyId: policyDecision.policyId,
    policyVersion: policyDecision.policyVersion,
    decidedAt: policyDecision.decidedAt,
    evidenceRefs,
    criteria: policyDecision.criteria,
    secondPass: policyDecision.secondPass,
    note: [
      ...(policyDecision.rejectionReasons || []).map(code => `reject:${code}`),
      ...(policyDecision.repairReasons || []).map(code => `repair:${code}`)
    ].join('; ')
  });
}

export const V7_LIBRARY_REVIEWER_TYPES = Object.freeze([...REVIEWER_TYPES]);
export const V7_LIBRARY_HUMAN_REVIEW_OUTCOMES = Object.freeze([...HUMAN_OUTCOMES]);

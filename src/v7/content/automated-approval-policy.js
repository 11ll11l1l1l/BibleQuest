export const V7_LIBRARY_APPROVAL_POLICY_ID = 'biblequest.v7.library-release';
export const V7_LIBRARY_APPROVAL_POLICY_VERSION = '1.0.0';

export const V7_LIBRARY_APPROVAL_OUTCOMES = Object.freeze([
  'auto_approved',
  'rejected',
  'needs_repair'
]);

const RESULT_VALUES = new Set(['pass', 'fail', 'unknown']);
const CONTENT_TYPES = new Set(['book', 'devotional', 'past_teaching']);

const COMMON_CRITERIA = Object.freeze([
  Object.freeze({ id: 'source_identity', hard: true }),
  Object.freeze({ id: 'provenance', hard: true }),
  Object.freeze({ id: 'permitted_use_rights', hard: true }),
  Object.freeze({ id: 'source_fidelity', hard: true }),
  Object.freeze({ id: 'scripture_reference_validity', hard: true }),
  Object.freeze({ id: 'scripture_context', hard: true }),
  Object.freeze({ id: 'theological_fidelity', hard: true }),
  Object.freeze({ id: 'editorial_coherence', hard: false }),
  Object.freeze({ id: 'audience_suitability', hard: false }),
  Object.freeze({ id: 'duplicate_fragment_detection', hard: false }),
  Object.freeze({ id: 'emotion_need_relevance', hard: false }),
  Object.freeze({ id: 'catalog_diversity', hard: false }),
  Object.freeze({ id: 'revision_integrity', hard: true }),
  Object.freeze({ id: 'metadata_integrity', hard: true }),
  Object.freeze({ id: 'adversarial_qa', hard: true })
]);

const DEVOTIONAL_TRANSLATION_CRITERIA = Object.freeze([
  Object.freeze({ id: 'translation_completeness', hard: true }),
  Object.freeze({ id: 'translation_semantic_fidelity', hard: true }),
  Object.freeze({ id: 'translation_naturalness', hard: false })
]);

function clean(value) {
  return String(value ?? '').trim();
}

function validTimestamp(value) {
  return Boolean(clean(value)) && Number.isFinite(Date.parse(value));
}

function freezeArray(rows) {
  return Object.freeze(rows.map(row => Object.freeze(row)));
}

function criteriaFor(contentType) {
  if (!CONTENT_TYPES.has(contentType)) throw new TypeError('item.type must be book, devotional, or past_teaching');
  return contentType === 'devotional'
    ? Object.freeze([...COMMON_CRITERIA, ...DEVOTIONAL_TRANSLATION_CRITERIA])
    : COMMON_CRITERIA;
}

function evidenceRefs(value, criterionId) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError(`evaluation ${criterionId} requires at least one evidenceRef`);
  }
  const refs = value.map(ref => clean(ref));
  if (refs.some(ref => !ref)) throw new TypeError(`evaluation ${criterionId} contains an empty evidenceRef`);
  if (new Set(refs).size !== refs.length) throw new TypeError(`evaluation ${criterionId} contains duplicate evidenceRefs`);
  return Object.freeze(refs);
}

function normalizeEvaluation(row, criterion) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return Object.freeze({
      id: criterion.id,
      result: 'unknown',
      hard: criterion.hard,
      evidenceRefs: Object.freeze([]),
      evaluator: '',
      evaluatedAt: null,
      note: 'No evaluation was supplied.'
    });
  }
  const result = clean(row.result);
  if (!RESULT_VALUES.has(result)) throw new TypeError(`evaluation ${criterion.id}.result must be pass, fail, or unknown`);
  const evaluator = clean(row.evaluator);
  if (!evaluator) throw new TypeError(`evaluation ${criterion.id}.evaluator is required`);
  if (!validTimestamp(row.evaluatedAt)) throw new TypeError(`evaluation ${criterion.id}.evaluatedAt must be a valid timestamp`);
  const refs = result === 'unknown'
    ? Object.freeze(Array.isArray(row.evidenceRefs) ? row.evidenceRefs.map(clean).filter(Boolean) : [])
    : evidenceRefs(row.evidenceRefs, criterion.id);
  const note = clean(row.note);
  return Object.freeze({
    id: criterion.id,
    result,
    hard: criterion.hard,
    evidenceRefs: refs,
    evaluator,
    evaluatedAt: new Date(row.evaluatedAt).toISOString(),
    ...(note ? { note } : {})
  });
}

function normalizeSecondPass(secondPass, revision) {
  if (!secondPass || typeof secondPass !== 'object' || Array.isArray(secondPass)) {
    return Object.freeze({ ready: false, reason: 'missing_second_pass' });
  }
  const result = clean(secondPass.result);
  if (!RESULT_VALUES.has(result)) throw new TypeError('secondPass.result must be pass, fail, or unknown');
  const evaluator = clean(secondPass.evaluator);
  if (!evaluator) throw new TypeError('secondPass.evaluator is required');
  if (!validTimestamp(secondPass.evaluatedAt)) throw new TypeError('secondPass.evaluatedAt must be a valid timestamp');
  const evaluatedRevision = clean(secondPass.revision);
  const refs = result === 'unknown'
    ? Object.freeze(Array.isArray(secondPass.evidenceRefs) ? secondPass.evidenceRefs.map(clean).filter(Boolean) : [])
    : evidenceRefs(secondPass.evidenceRefs, 'second_pass');
  const note = clean(secondPass.note);
  return Object.freeze({
    ready: result === 'pass' && evaluatedRevision === revision,
    result,
    evaluator,
    revision: evaluatedRevision,
    evaluatedAt: new Date(secondPass.evaluatedAt).toISOString(),
    evidenceRefs: refs,
    ...(note ? { note } : {})
  });
}

function rightsHardFailure(item) {
  if (item?.rights?.status !== 'verified') return 'rights_not_verified';
  if (!Array.isArray(item?.rights?.allowedUses) || item.rights.allowedUses.length === 0) return 'no_permitted_use';
  if (item?.source?.kind === 'fixture') return 'fixture_source';
  return '';
}

export function evaluateV7LibraryApproval({
  item,
  evaluations = [],
  secondPass,
  decidedAt = new Date().toISOString(),
  policyId = V7_LIBRARY_APPROVAL_POLICY_ID,
  policyVersion = V7_LIBRARY_APPROVAL_POLICY_VERSION
} = {}) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) throw new TypeError('item is required');
  const itemId = clean(item.id);
  const revision = clean(item.revision);
  const contentType = clean(item.type);
  if (!itemId) throw new TypeError('item.id is required');
  if (!revision) throw new TypeError('item.revision is required');
  const criteria = criteriaFor(contentType);
  if (!validTimestamp(decidedAt)) throw new TypeError('decidedAt must be a valid timestamp');
  if (!Array.isArray(evaluations)) throw new TypeError('evaluations must be an array');

  const evaluationById = new Map();
  for (const row of evaluations) {
    const id = clean(row?.id);
    if (!id) throw new TypeError('each evaluation.id is required');
    if (evaluationById.has(id)) throw new TypeError(`duplicate evaluation for ${id}`);
    evaluationById.set(id, row);
  }
  const allowed = new Set(criteria.map(row => row.id));
  for (const id of evaluationById.keys()) {
    if (!allowed.has(id)) throw new TypeError(`unsupported evaluation criterion ${id} for ${contentType}`);
  }

  const normalized = freezeArray(criteria.map(criterion => normalizeEvaluation(evaluationById.get(criterion.id), criterion)));
  const hardFailures = normalized.filter(row => row.hard && row.result === 'fail').map(row => row.id);
  const repairFailures = normalized.filter(row => !row.hard && row.result === 'fail').map(row => row.id);
  const unknownCriteria = normalized.filter(row => row.result === 'unknown').map(row => row.id);
  const hardBoundary = rightsHardFailure(item);
  const normalizedSecondPass = normalizeSecondPass(secondPass, revision);

  const primaryEvaluators = new Set(normalized.filter(row => row.result !== 'unknown').map(row => row.evaluator));
  const independentSecondPass = normalizedSecondPass.ready
    && !primaryEvaluators.has(normalizedSecondPass.evaluator);
  const secondPassHardFailure = normalizedSecondPass.result === 'fail' ? 'adversarial_second_pass_failed' : '';
  const staleSecondPass = normalizedSecondPass.result === 'pass' && normalizedSecondPass.revision !== revision;

  const rejectionReasons = [
    ...(hardBoundary ? [hardBoundary] : []),
    ...hardFailures,
    ...(secondPassHardFailure ? [secondPassHardFailure] : []),
    ...(staleSecondPass ? ['second_pass_revision_mismatch'] : [])
  ];
  const repairReasons = [
    ...repairFailures,
    ...unknownCriteria,
    ...(!normalizedSecondPass.ready || !independentSecondPass
      ? ['independent_second_pass_incomplete']
      : [])
  ];

  const outcome = rejectionReasons.length
    ? 'rejected'
    : repairReasons.length
      ? 'needs_repair'
      : 'auto_approved';

  return Object.freeze({
    schemaVersion: 1,
    itemId,
    revision,
    contentType,
    outcome,
    reviewerType: 'automated_policy',
    policyId: clean(policyId) || V7_LIBRARY_APPROVAL_POLICY_ID,
    policyVersion: clean(policyVersion) || V7_LIBRARY_APPROVAL_POLICY_VERSION,
    decidedAt: new Date(decidedAt).toISOString(),
    rightsStatusSnapshot: clean(item?.rights?.status),
    criteria: normalized,
    secondPass: normalizedSecondPass,
    rejectionReasons: Object.freeze(rejectionReasons),
    repairReasons: Object.freeze(repairReasons),
    auditable: normalized.every(row => row.result === 'unknown' || (row.evidenceRefs.length > 0 && validTimestamp(row.evaluatedAt)))
      && (normalizedSecondPass.result === 'unknown' || (normalizedSecondPass.evidenceRefs.length > 0 && validTimestamp(normalizedSecondPass.evaluatedAt)))
  });
}

export function canAutoPublishV7LibraryDecision(decision, item) {
  if (!decision || typeof decision !== 'object' || Array.isArray(decision)) return false;
  return decision.schemaVersion === 1
    && decision.reviewerType === 'automated_policy'
    && decision.outcome === 'auto_approved'
    && decision.policyId === V7_LIBRARY_APPROVAL_POLICY_ID
    && decision.policyVersion === V7_LIBRARY_APPROVAL_POLICY_VERSION
    && decision.itemId === item?.id
    && decision.revision === item?.revision
    && decision.rightsStatusSnapshot === 'verified'
    && decision.auditable === true
    && Array.isArray(decision.criteria)
    && decision.criteria.length === criteriaFor(item?.type).length
    && decision.criteria.every(row => row.result === 'pass' && validTimestamp(row.evaluatedAt))
    && decision.secondPass?.ready === true
    && validTimestamp(decision.secondPass?.evaluatedAt);
}

export function requiredV7LibraryApprovalCriteria(contentType) {
  return criteriaFor(contentType);
}

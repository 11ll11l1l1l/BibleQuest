const DECISION_KINDS = Object.freeze(['devotional_candidate', 'bsb_reference']);
const OUTCOMES = Object.freeze(['validated', 'rejected']);
const LEDGER_STATUSES = Object.freeze([
  'awaiting_context_review',
  'partial_context_review',
  'context_review_complete'
]);

function textPresent(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validTimestamp(value) {
  return textPresent(value) && Number.isFinite(Date.parse(value));
}

function buildSourceEntryIndex(sourceCatalogs) {
  if (!Array.isArray(sourceCatalogs)) throw new TypeError('sourceCatalogs must be an array');
  const entries = new Map();
  for (const catalog of sourceCatalogs) {
    for (const source of catalog?.sources || []) {
      if (!textPresent(source?.id) || !textPresent(source?.author) || !textPresent(source?.entryIdPrefix)) {
        throw new TypeError('source catalog entries require source id, author and entryIdPrefix');
      }
      for (const entry of source.entries || []) {
        if (!textPresent(entry?.id)) throw new TypeError(`${source.id} contains an entry without an id`);
        const id = `${source.entryIdPrefix}${entry.id}`;
        if (entries.has(id)) throw new TypeError(`duplicate source entry ${id}`);
        entries.set(id, Object.freeze({ workId: source.id, author: source.author }));
      }
    }
  }
  return entries;
}

function exactEmotionInventory(baseCoverage, other, label) {
  const canonical = (baseCoverage?.emotions || []).map(row => row.id);
  const candidate = (other?.emotions || []).map(row => row.id);
  if (!canonical.length || new Set(canonical).size !== canonical.length) {
    throw new TypeError('baseCoverage must contain unique canonical emotions');
  }
  if (candidate.length !== canonical.length
      || canonical.some(id => !candidate.includes(id))
      || new Set(candidate).size !== candidate.length) {
    throw new TypeError(`${label} emotion inventory must exactly match baseCoverage`);
  }
  return canonical;
}

function targetForEmotion(rows, emotionId, property) {
  const row = rows.find(item => item.id === emotionId);
  const values = row?.[property];
  if (!Array.isArray(values)) throw new TypeError(`${emotionId} is missing ${property}`);
  return values;
}

function decisionKey(decision) {
  return `${decision.kind}|\u0000${decision.emotionId}|\u0000${decision.target}`;
}

export function assessV7DevotionalCurationReview({
  baseCoverage,
  expansion,
  bsbSeed,
  sourceCatalogs,
  decisionLedger
}) {
  if (!baseCoverage?.launchTarget) throw new TypeError('baseCoverage.launchTarget is required');
  const canonicalEmotionIds = exactEmotionInventory(baseCoverage, expansion, 'expansion');
  exactEmotionInventory(baseCoverage, bsbSeed, 'bsbSeed');
  const sourceEntries = buildSourceEntryIndex(sourceCatalogs);

  if (decisionLedger?.schemaVersion !== 1) throw new TypeError('decisionLedger.schemaVersion must be 1');
  if (decisionLedger?.scope !== 'v7_a2_devotional_curation_context_review') {
    throw new TypeError('decisionLedger.scope is invalid');
  }
  if (!LEDGER_STATUSES.includes(decisionLedger?.status)) throw new TypeError('decisionLedger.status is invalid');
  if (!Array.isArray(decisionLedger?.decisions)) throw new TypeError('decisionLedger.decisions must be an array');

  const allowedCandidates = new Map();
  const allowedBsb = new Map();
  for (const emotionId of canonicalEmotionIds) {
    const candidateRefs = [
      ...targetForEmotion(baseCoverage.emotions, emotionId, 'candidateRefs'),
      ...targetForEmotion(expansion.emotions, emotionId, 'candidateRefs')
    ];
    if (new Set(candidateRefs).size !== candidateRefs.length) {
      throw new TypeError(`${emotionId} contains duplicate candidate refs across research queues`);
    }
    for (const ref of candidateRefs) {
      if (!sourceEntries.has(ref)) throw new TypeError(`${emotionId} references unknown source entry ${ref}`);
    }
    allowedCandidates.set(emotionId, new Set(candidateRefs));
    allowedBsb.set(emotionId, new Set(targetForEmotion(bsbSeed.emotions, emotionId, 'candidateReferences')));
  }

  const seen = new Set();
  const validatedCandidates = new Map(canonicalEmotionIds.map(id => [id, []]));
  const validatedBsb = new Map(canonicalEmotionIds.map(id => [id, []]));

  for (const decision of decisionLedger.decisions) {
    if (decision?.schemaVersion !== 1) throw new TypeError('each decision.schemaVersion must be 1');
    if (!DECISION_KINDS.includes(decision?.kind)) throw new TypeError('decision.kind is invalid');
    if (!canonicalEmotionIds.includes(decision?.emotionId)) throw new TypeError(`unknown emotion ${decision?.emotionId}`);
    if (!textPresent(decision?.target)) throw new TypeError('decision.target is required');
    if (!OUTCOMES.includes(decision?.outcome)) throw new TypeError('decision.outcome is invalid');
    if (!textPresent(decision?.reviewer)) throw new TypeError('decision.reviewer is required');
    if (!validTimestamp(decision?.decidedAt)) throw new TypeError('decision.decidedAt must be a valid timestamp');
    if (!textPresent(decision?.evidenceNote)) throw new TypeError('decision.evidenceNote is required');

    const allowed = decision.kind === 'devotional_candidate'
      ? allowedCandidates.get(decision.emotionId)
      : allowedBsb.get(decision.emotionId);
    if (!allowed.has(decision.target)) {
      throw new TypeError(`${decision.emotionId} decision targets an unknown ${decision.kind}: ${decision.target}`);
    }

    const key = decisionKey(decision);
    if (seen.has(key)) throw new TypeError(`duplicate curation decision for ${decision.emotionId}/${decision.target}`);
    seen.add(key);

    if (decision.outcome === 'validated') {
      const bucket = decision.kind === 'devotional_candidate'
        ? validatedCandidates.get(decision.emotionId)
        : validatedBsb.get(decision.emotionId);
      bucket.push(decision.target);
    }
  }

  const thresholds = Object.freeze({
    candidateCount: Number(baseCoverage.launchTarget.candidateCountPerEmotion),
    workCount: Number(baseCoverage.launchTarget.distinctWorkCountPerEmotion),
    authorCount: Number(baseCoverage.launchTarget.distinctAuthorCountPerEmotion),
    bsbReferenceCount: Number(baseCoverage.launchTarget.directBsbReferenceCountPerEmotion)
  });
  if (Object.values(thresholds).some(value => !Number.isInteger(value) || value <= 0)) {
    throw new TypeError('baseCoverage.launchTarget thresholds must be positive integers');
  }

  const emotions = canonicalEmotionIds.map(emotionId => {
    const candidateRefs = [...validatedCandidates.get(emotionId)].sort();
    const bsbReferences = [...validatedBsb.get(emotionId)].sort();
    const resolved = candidateRefs.map(ref => sourceEntries.get(ref));
    const workCount = new Set(resolved.map(row => row.workId)).size;
    const authorCount = new Set(resolved.map(row => row.author)).size;
    const ready = candidateRefs.length >= thresholds.candidateCount
      && workCount >= thresholds.workCount
      && authorCount >= thresholds.authorCount
      && bsbReferences.length >= thresholds.bsbReferenceCount;

    return Object.freeze({
      id: emotionId,
      ready,
      validatedCandidateCount: candidateRefs.length,
      validatedWorkCount: workCount,
      validatedAuthorCount: authorCount,
      validatedBsbReferenceCount: bsbReferences.length,
      validatedCandidateRefs: Object.freeze(candidateRefs),
      validatedBsbReferences: Object.freeze(bsbReferences)
    });
  });

  const readyEmotionCount = emotions.filter(row => row.ready).length;
  const expectedStatus = decisionLedger.decisions.length === 0
    ? 'awaiting_context_review'
    : readyEmotionCount === canonicalEmotionIds.length
      ? 'context_review_complete'
      : 'partial_context_review';
  if (decisionLedger.status !== expectedStatus) {
    throw new TypeError(`decisionLedger.status must be ${expectedStatus} for the committed decisions`);
  }

  return Object.freeze({
    ready: readyEmotionCount === canonicalEmotionIds.length,
    canonicalEmotionCount: canonicalEmotionIds.length,
    readyEmotionCount,
    decisionCount: decisionLedger.decisions.length,
    thresholds,
    boundary: Object.freeze({
      doesNotApproveEditorialPublication: true,
      doesNotChangeRights: true,
      doesNotSatisfyTranslationReview: true,
      validatedMappingsStillRequireSeparatePublicationApproval: true
    }),
    emotions: Object.freeze(emotions)
  });
}

export const V7_DEVOTIONAL_CURATION_DECISION_KINDS = DECISION_KINDS;
export const V7_DEVOTIONAL_CURATION_DECISION_OUTCOMES = OUTCOMES;

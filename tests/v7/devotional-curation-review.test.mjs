import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { assessV7DevotionalCurationReview } from '../../src/v7/content/devotional-curation-review.js';

const readJson = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

const baseCoverage = readJson('../../data/v7/curation/devotional-emotion-coverage-seed.json');
const expansion = readJson('../../data/v7/curation/devotional-emotion-candidate-expansion-02.json');
const bsbSeed = readJson('../../data/v7/curation/devotional-emotion-bsb-reference-seed.json');
const sourceIndex = readJson('../../data/v7/content-sources/devotional-source-index.json');
const sourceCatalogs = sourceIndex.catalogRefs.map(ref => readJson(`../../${ref}`));
const emptyLedger = readJson('../../data/v7/curation/devotional-curation-review-decisions.json');

function assess(decisionLedger) {
  return assessV7DevotionalCurationReview({
    baseCoverage,
    expansion,
    bsbSeed,
    sourceCatalogs,
    decisionLedger
  });
}

function decision(kind, emotionId, target, patch = {}) {
  return {
    schemaVersion: 1,
    kind,
    emotionId,
    target,
    outcome: 'validated',
    reviewer: 'context-reviewer',
    decidedAt: '2026-10-07T00:00:00Z',
    evidenceNote: 'Compared the candidate against its source/body context; this records curation relevance only.',
    ...patch
  };
}

test('A2 curation decision ledger is empty and fail-closed by default', () => {
  const report = assess(emptyLedger);
  assert.equal(report.ready, false);
  assert.equal(report.canonicalEmotionCount, 30);
  assert.equal(report.readyEmotionCount, 0);
  assert.equal(report.decisionCount, 0);
  assert.equal(report.boundary.doesNotApproveEditorialPublication, true);
  assert.equal(report.boundary.doesNotChangeRights, true);
  assert.equal(report.boundary.doesNotSatisfyTranslationReview, true);
  assert.ok(report.emotions.every(row => row.validatedCandidateCount === 0));
  assert.ok(report.emotions.every(row => row.validatedBsbReferenceCount === 0));
});

test('validated context decisions can satisfy one emotion without authorizing publication', () => {
  const emotionId = 'anxiety_worry';
  const base = baseCoverage.emotions.find(row => row.id === emotionId);
  const added = expansion.emotions.find(row => row.id === emotionId);
  const bsb = bsbSeed.emotions.find(row => row.id === emotionId);
  const decisions = [
    ...[...base.candidateRefs, ...added.candidateRefs].map(ref => decision('devotional_candidate', emotionId, ref)),
    ...bsb.candidateReferences.map(reference => decision('bsb_reference', emotionId, reference))
  ];
  const report = assess({
    ...emptyLedger,
    status: 'partial_context_review',
    decisions
  });
  const anxiety = report.emotions.find(row => row.id === emotionId);

  assert.equal(anxiety.ready, true);
  assert.ok(anxiety.validatedCandidateCount >= report.thresholds.candidateCount);
  assert.ok(anxiety.validatedWorkCount >= report.thresholds.workCount);
  assert.ok(anxiety.validatedAuthorCount >= report.thresholds.authorCount);
  assert.equal(anxiety.validatedBsbReferenceCount, report.thresholds.bsbReferenceCount);
  assert.equal(report.readyEmotionCount, 1);
  assert.equal(report.ready, false);
  assert.equal(report.boundary.validatedMappingsStillRequireSeparatePublicationApproval, true);
});

test('A2 curation decisions reject unknown targets, duplicates and false status claims', () => {
  assert.throws(() => assess({
    ...emptyLedger,
    status: 'partial_context_review',
    decisions: [decision('bsb_reference', 'anxiety_worry', 'Genesis 1:1')]
  }), /unknown bsb_reference/);

  const duplicate = decision('bsb_reference', 'anxiety_worry', 'Philippians 4:6-7');
  assert.throws(() => assess({
    ...emptyLedger,
    status: 'partial_context_review',
    decisions: [duplicate, { ...duplicate }]
  }), /duplicate curation decision/);

  assert.throws(() => assess({
    ...emptyLedger,
    status: 'context_review_complete',
    decisions: []
  }), /status must be awaiting_context_review/);
});

test('A2 curation decisions require accountable review metadata', () => {
  assert.throws(() => assess({
    ...emptyLedger,
    status: 'partial_context_review',
    decisions: [decision('bsb_reference', 'fear', 'Isaiah 41:10', { reviewer: '' })]
  }), /reviewer is required/);

  assert.throws(() => assess({
    ...emptyLedger,
    status: 'partial_context_review',
    decisions: [decision('bsb_reference', 'fear', 'Isaiah 41:10', { decidedAt: 'not-a-date' })]
  }), /valid timestamp/);

  assert.throws(() => assess({
    ...emptyLedger,
    status: 'partial_context_review',
    decisions: [decision('bsb_reference', 'fear', 'Isaiah 41:10', { evidenceNote: '' })]
  }), /evidenceNote is required/);
});

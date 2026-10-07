import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readJson(relativePath) {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
}

const catalog = readJson('../../data/v7/content-sources/devotional-source-catalog.json');
const coverage = readJson('../../data/v7/curation/devotional-emotion-coverage-seed.json');

const EXPECTED_EMOTIONS = [
  'anxiety_worry',
  'fear',
  'sadness',
  'grief_loss',
  'loneliness',
  'anger',
  'hurt_betrayal',
  'rejection',
  'guilt',
  'shame',
  'insecurity_unworthiness',
  'doubt',
  'confusion_uncertainty',
  'discouragement',
  'hopelessness',
  'overwhelm',
  'stress',
  'tiredness_weariness',
  'spiritual_dryness_distance',
  'temptation',
  'impatience_waiting',
  'jealousy_envy',
  'frustration',
  'numbness_emptiness',
  'joy',
  'gratitude',
  'peace_contentment',
  'hope',
  'excitement',
  'love_connection'
];

function buildEntryIndex() {
  const entries = new Map();
  for (const source of catalog.sources) {
    assert.match(source.id, /^source\.[a-z0-9.-]+$/);
    assert.match(source.entryIdPrefix, /^entry\.[a-z0-9.-]+\.$/);
    for (const entry of source.entries) {
      const id = `${source.entryIdPrefix}${entry.id}`;
      assert.equal(entries.has(id), false, `duplicate source entry ${id}`);
      entries.set(id, { source, entry });
    }
  }
  return entries;
}

function metricsForEmotion(emotion, entries) {
  const sourceRows = emotion.candidateRefs.map(ref => entries.get(ref).source);
  return {
    candidateCount: emotion.candidateRefs.length,
    distinctWorkCount: new Set(sourceRows.map(source => source.id)).size,
    distinctAuthorCount: new Set(sourceRows.map(source => source.author)).size,
    directBsbReferenceCount: Array.isArray(emotion.directBsbReferences)
      ? emotion.directBsbReferences.length
      : 0
  };
}

test('A2 source catalog remains candidate-only and fail-closed for global hosting', () => {
  assert.equal(catalog.schemaVersion, 1);
  assert.equal(catalog.scope, 'v7_a2_devotional_source_pool');
  assert.equal(catalog.status, 'research_seed_incomplete');
  assert.equal(catalog.policy.bodyStorage, 'none_in_this_catalog');
  assert.equal(catalog.policy.defaultHostingMode, 'external_link');
  assert.equal(catalog.policy.globalHostingRequiresExplicitReview, true);
  assert.equal(catalog.policy.candidatePointersDoNotAuthorizePublication, true);

  assert.equal(catalog.sources.length, 4);
  assert.equal(new Set(catalog.sources.map(source => source.id)).size, catalog.sources.length);

  for (const source of catalog.sources) {
    assert.equal(source.hostingMode, 'external_link', `${source.id} must remain link-only`);
    assert.equal(source.editorialStatus, 'candidate', `${source.id} must remain editorial candidate`);
    assert.equal(source.publicationState, 'candidate_only', `${source.id} must not be publishable`);
    assert.ok(source.rightsEvidence?.statement, `${source.id} needs a rights evidence statement`);
    assert.ok(source.rightsEvidence?.evidenceUrl, `${source.id} needs a rights evidence URL`);
    assert.ok(source.rightsEvidence?.globalUseConcern, `${source.id} needs an explicit global-use concern`);
    assert.equal(Object.hasOwn(source, 'body'), false, `${source.id} must not host a copied source body here`);
  }
});

test('A2 source catalog contains 80 stable, unique entry pointers', () => {
  const entries = buildEntryIndex();
  assert.equal(entries.size, 80);
  assert.equal(catalog.summary.sourceCount, catalog.sources.length);
  assert.equal(catalog.summary.entryPointerCount, entries.size);
  assert.deepEqual(
    catalog.summary.authors,
    [...new Set(catalog.sources.map(source => source.author))].sort()
  );
});

test('A2 emotion seed covers exactly the 30 launch emotions without claiming target completion', () => {
  assert.equal(coverage.schemaVersion, 1);
  assert.equal(coverage.scope, 'v7_a2_devotional_emotion_coverage_seed');
  assert.equal(coverage.status, 'seed_incomplete_not_release_ready');
  assert.equal(coverage.mappingBoundary.candidateMappingsAreResearchOnly, true);
  assert.equal(coverage.mappingBoundary.titleLevelMappingsRequireBodyValidation, true);
  assert.equal(coverage.mappingBoundary.rightsClearanceStillRequired, true);
  assert.equal(coverage.mappingBoundary.editorialReviewStillRequired, true);
  assert.equal(coverage.mappingBoundary.translationReviewStillRequiredForLocalizedPublication, true);
  assert.equal(coverage.mappingBoundary.bsbReferenceReviewStillRequired, true);

  const ids = coverage.emotions.map(emotion => emotion.id);
  assert.deepEqual([...ids].sort(), [...EXPECTED_EMOTIONS].sort());
  assert.equal(new Set(ids).size, EXPECTED_EMOTIONS.length);
});

test('A2 emotion seed references only catalogued entries and reports threshold metrics truthfully', () => {
  const entries = buildEntryIndex();
  let zeroCandidateEmotionCount = 0;
  let emotionsMeetingCandidateTarget = 0;
  let emotionsMeetingWorkTarget = 0;
  let emotionsMeetingAuthorTarget = 0;
  let emotionsMeetingBsbReferenceTarget = 0;

  for (const emotion of coverage.emotions) {
    assert.ok(Array.isArray(emotion.candidateRefs));
    assert.equal(new Set(emotion.candidateRefs).size, emotion.candidateRefs.length, `${emotion.id} has duplicate candidates`);
    for (const ref of emotion.candidateRefs) {
      assert.ok(entries.has(ref), `${emotion.id} references unknown candidate ${ref}`);
    }

    const metrics = metricsForEmotion(emotion, entries);
    if (metrics.candidateCount === 0) zeroCandidateEmotionCount += 1;
    if (metrics.candidateCount >= coverage.launchTarget.candidateCountPerEmotion) emotionsMeetingCandidateTarget += 1;
    if (metrics.distinctWorkCount >= coverage.launchTarget.distinctWorkCountPerEmotion) emotionsMeetingWorkTarget += 1;
    if (metrics.distinctAuthorCount >= coverage.launchTarget.distinctAuthorCountPerEmotion) emotionsMeetingAuthorTarget += 1;
    if (metrics.directBsbReferenceCount >= coverage.launchTarget.directBsbReferenceCountPerEmotion) emotionsMeetingBsbReferenceTarget += 1;
  }

  assert.deepEqual(coverage.summary, {
    canonicalEmotionCount: EXPECTED_EMOTIONS.length,
    zeroCandidateEmotionCount,
    emotionsMeetingCandidateTarget,
    emotionsMeetingWorkTarget,
    emotionsMeetingAuthorTarget,
    emotionsMeetingBsbReferenceTarget
  });

  assert.equal(coverage.summary.zeroCandidateEmotionCount, 0);
  assert.ok(coverage.summary.emotionsMeetingCandidateTarget < EXPECTED_EMOTIONS.length);
  assert.ok(coverage.summary.emotionsMeetingBsbReferenceTarget < EXPECTED_EMOTIONS.length);
});

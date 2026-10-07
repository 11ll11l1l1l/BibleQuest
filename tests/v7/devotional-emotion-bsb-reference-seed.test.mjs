import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readJson(relativePath) {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
}

const coverage = readJson('../../data/v7/curation/devotional-emotion-coverage-seed.json');
const bsbSeed = readJson('../../data/v7/curation/devotional-emotion-bsb-reference-seed.json');

const REFERENCE_PATTERN = /^(?:[1-3] )?[A-Za-z]+(?: [A-Za-z]+)* \d+:\d+(?:-\d+)?$/;

function countTextFields(value) {
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + countTextFields(item), 0);
  if (!value || typeof value !== 'object') return 0;
  return Object.entries(value).reduce(
    (sum, [key, child]) => sum + (key === 'text' ? 1 : 0) + countTextFields(child),
    0
  );
}

test('A2 BSB reference seed is reference-only and explicitly unreviewed', () => {
  assert.equal(bsbSeed.schemaVersion, 1);
  assert.equal(bsbSeed.scope, 'v7_a2_devotional_emotion_bsb_reference_seed');
  assert.equal(bsbSeed.status, 'research_seed_needs_editorial_validation');
  assert.equal(bsbSeed.bibleVersion, 'BSB');
  assert.equal(bsbSeed.rightsEvidence.status, 'public_domain');
  assert.equal(bsbSeed.rightsEvidence.effectiveDate, '2023-04-30');
  assert.equal(bsbSeed.rightsEvidence.sourceUrl, 'https://berean.bible/terms.htm');
  assert.equal(bsbSeed.contentBoundary.storesVerseText, false);
  assert.equal(bsbSeed.contentBoundary.referenceOnly, true);
  assert.equal(bsbSeed.contentBoundary.candidateReferencesAreUnreviewed, true);
  assert.equal(bsbSeed.contentBoundary.contextAndRelevanceReviewRequired, true);
  assert.equal(bsbSeed.contentBoundary.doesNotSatisfyReviewedReferenceGate, true);
  assert.equal(countTextFields(bsbSeed), 0, 'reference seed must not store Bible verse text');
});

test('A2 BSB seed covers exactly the same 30 canonical emotions as the source coverage seed', () => {
  const coverageIds = coverage.emotions.map(emotion => emotion.id).sort();
  const bsbIds = bsbSeed.emotions.map(emotion => emotion.id).sort();
  assert.deepEqual(bsbIds, coverageIds);
  assert.equal(bsbIds.length, 30);
  assert.equal(new Set(bsbIds).size, 30);
});

test('A2 BSB seed has exactly five unique candidate references per emotion', () => {
  let candidateReferenceCount = 0;

  for (const emotion of bsbSeed.emotions) {
    assert.equal(emotion.candidateReferences.length, 5, `${emotion.id} must have exactly five seed references`);
    assert.equal(
      new Set(emotion.candidateReferences).size,
      emotion.candidateReferences.length,
      `${emotion.id} must not repeat a reference`
    );
    for (const reference of emotion.candidateReferences) {
      assert.match(reference, REFERENCE_PATTERN, `${emotion.id} has malformed Scripture reference ${reference}`);
      candidateReferenceCount += 1;
    }
  }

  assert.equal(candidateReferenceCount, 150);
  assert.equal(bsbSeed.summary.canonicalEmotionCount, bsbSeed.emotions.length);
  assert.equal(bsbSeed.summary.candidateReferenceCount, candidateReferenceCount);
  assert.equal(bsbSeed.summary.candidateReferencesPerEmotion, 5);
});

test('A2 BSB candidate references do not falsely satisfy the reviewed release threshold', () => {
  assert.equal(bsbSeed.summary.reviewedEmotionCount, 0);
  assert.equal(bsbSeed.summary.emotionsMeetingReviewedReferenceTarget, 0);
  assert.equal(coverage.summary.emotionsMeetingBsbReferenceTarget, 0);
});

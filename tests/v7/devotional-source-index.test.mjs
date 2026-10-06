import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readJson(relativePath) {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
}

const index = readJson('../../data/v7/content-sources/devotional-source-index.json');
const catalogs = index.catalogRefs.map(ref => readJson(`../../${ref}`));

function sourceEntries(source) {
  return source.entries.map(entry => `${source.entryIdPrefix}${entry.id}`);
}

test('A2 aggregate devotional source index truthfully reports the research pool', () => {
  const sources = catalogs.flatMap(catalog => catalog.sources);
  const entryIds = sources.flatMap(sourceEntries);
  const authors = new Set(sources.map(source => source.author));

  assert.equal(index.schemaVersion, 1);
  assert.equal(index.scope, 'v7_a2_devotional_source_pool_index');
  assert.equal(index.status, 'research_pool_target_range_reached_not_release_ready');
  assert.equal(sources.length, index.aggregate.sourceCount);
  assert.equal(entryIds.length, index.aggregate.entryPointerCount);
  assert.equal(new Set(entryIds).size, entryIds.length);
  assert.equal(authors.size, index.aggregate.distinctAuthorCount);
  assert.equal(index.aggregate.entryPointerCount, 173);
  assert.ok(index.aggregate.entryPointerCount >= index.aggregate.targetEntryPointerRange.minimum);
  assert.ok(index.aggregate.entryPointerCount <= index.aggregate.targetEntryPointerRange.maximum);
  assert.equal(index.aggregate.withinTargetEntryPointerRange, true);
});

test('A2 second source tranche remains link-only, candidate-only and rights fail-closed', () => {
  const tranche = catalogs.find(catalog => catalog.scope === 'v7_a2_devotional_source_pool_tranche_02');
  assert.ok(tranche);
  assert.equal(tranche.summary.sourceCount, 3);
  assert.equal(tranche.summary.entryPointerCount, 93);

  for (const source of tranche.sources) {
    assert.equal(source.entries.length, 31, `${source.id} must expose 31 stable pointers`);
    assert.equal(source.hostingMode, 'external_link', `${source.id} must remain link-only`);
    assert.equal(source.editorialStatus, 'candidate', `${source.id} must remain a candidate`);
    assert.equal(source.publicationState, 'candidate_only', `${source.id} must remain unpublished`);
    assert.ok(source.rightsEvidence?.statement, `${source.id} needs rights evidence`);
    assert.ok(source.rightsEvidence?.globalUseConcern, `${source.id} needs a global-use caveat`);
    assert.equal(Object.hasOwn(source, 'body'), false, `${source.id} must not copy source bodies`);
  }
});

test('A2 research seeds can exist without falsely satisfying reviewed release gates', () => {
  assert.deepEqual(index.curationRefs, [
    'data/v7/curation/devotional-emotion-coverage-seed.json',
    'data/v7/curation/devotional-emotion-bsb-reference-seed.json'
  ]);
  assert.equal(index.releaseBoundary.sourcePoolDepthTargetReached, true);
  assert.equal(index.releaseBoundary.emotionCandidateSeedPresent, true);
  assert.equal(index.releaseBoundary.bsbCandidateReferenceSeedPresent, true);
  assert.equal(index.releaseBoundary.emotionValidationTargetReached, false);
  assert.equal(index.releaseBoundary.bsbReferenceTargetReached, false);
  assert.equal(index.releaseBoundary.globalHostingClearanceComplete, false);
  assert.equal(index.releaseBoundary.editorialReviewComplete, false);
  assert.equal(index.releaseBoundary.translationReviewComplete, false);
  assert.equal(index.releaseBoundary.publicationAuthorized, false);
});

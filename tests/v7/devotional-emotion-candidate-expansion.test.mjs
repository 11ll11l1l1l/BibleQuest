import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readJson(relativePath) {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
}

const sourceIndex = readJson('../../data/v7/content-sources/devotional-source-index.json');
const catalogs = sourceIndex.catalogRefs.map(ref => readJson(`../../${ref}`));
const baseCoverage = readJson('../../data/v7/curation/devotional-emotion-coverage-seed.json');
const expansion = readJson('../../data/v7/curation/devotional-emotion-candidate-expansion-02.json');

function buildEntryIndex() {
  const entries = new Map();
  for (const catalog of catalogs) {
    for (const source of catalog.sources) {
      for (const entry of source.entries) {
        const id = `${source.entryIdPrefix}${entry.id}`;
        assert.equal(entries.has(id), false, `duplicate source entry ${id}`);
        entries.set(id, { source, entry });
      }
    }
  }
  return entries;
}

test('A2 candidate expansion covers exactly the canonical emotion inventory', () => {
  assert.equal(expansion.schemaVersion, 1);
  assert.equal(expansion.scope, 'v7_a2_devotional_emotion_candidate_expansion_02');
  assert.equal(expansion.status, 'research_candidates_needing_body_validation');
  assert.equal(expansion.mappingBasis, 'source_resolved_heading_candidate');
  assert.equal(expansion.reviewStatus, 'candidate');
  assert.equal(expansion.boundary.sourceEntryIdentityResolved, true);
  assert.equal(expansion.boundary.sourceHeadingResolved, true);
  assert.equal(expansion.boundary.bodyValidationRequired, true);
  assert.equal(expansion.boundary.doesNotCountAsEditorialApproval, true);

  const baseIds = baseCoverage.emotions.map(emotion => emotion.id).sort();
  const expansionIds = expansion.emotions.map(emotion => emotion.id).sort();
  assert.deepEqual(expansionIds, baseIds);
  assert.equal(expansionIds.length, 30);
});

test('A2 expansion adds exactly five unique source-resolved candidates per emotion', () => {
  const entries = buildEntryIndex();
  let links = 0;

  for (const emotion of expansion.emotions) {
    assert.equal(emotion.candidateRefs.length, 5, `${emotion.id} must add exactly five candidates`);
    assert.equal(new Set(emotion.candidateRefs).size, 5, `${emotion.id} contains duplicate added candidates`);
    for (const ref of emotion.candidateRefs) {
      const resolved = entries.get(ref);
      assert.ok(resolved, `${emotion.id} references unknown source entry ${ref}`);
      assert.ok(resolved.entry.label.length >= 8, `${emotion.id}/${ref} needs a resolved source heading`);
      links += 1;
    }
  }

  assert.equal(links, 150);
  assert.equal(expansion.summary.canonicalEmotionCount, 30);
  assert.equal(expansion.summary.candidateLinksAdded, links);
  assert.equal(expansion.summary.candidateLinksPerEmotionAdded, 5);
});

test('A2 combined research queue reaches raw count/work/author thresholds without claiming validation', () => {
  const entries = buildEntryIndex();
  const baseByEmotion = new Map(baseCoverage.emotions.map(emotion => [emotion.id, emotion]));

  for (const added of expansion.emotions) {
    const base = baseByEmotion.get(added.id);
    assert.ok(base, `missing base coverage for ${added.id}`);
    const refs = [...base.candidateRefs, ...added.candidateRefs];
    assert.equal(new Set(refs).size, refs.length, `${added.id} combined queue contains duplicate candidates`);

    const resolved = refs.map(ref => {
      const entry = entries.get(ref);
      assert.ok(entry, `${added.id} references unknown candidate ${ref}`);
      return entry;
    });
    const workCount = new Set(resolved.map(({ source }) => source.id)).size;
    const authorCount = new Set(resolved.map(({ source }) => source.author)).size;

    assert.ok(refs.length >= 10, `${added.id} must have at least 10 raw candidates`);
    assert.ok(workCount >= 3, `${added.id} must span at least 3 source works`);
    assert.ok(authorCount >= 2, `${added.id} must span at least 2 authors`);
  }

  assert.equal(expansion.boundary.bodyValidationRequired, true);
  assert.equal(sourceIndex.releaseBoundary.emotionValidationTargetReached, false);
});

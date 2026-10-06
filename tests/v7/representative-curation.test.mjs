import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readJson(path) {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
}

const curation = readJson('../../data/v7/curation/representative-enrichment.json');
const books = readJson('../../data/v7/books/representative-catalog.json');
const devotionalSamples = readJson('../../content/v7/devotionals/spurgeon-samples.json');
const devotionalExpansion = readJson('../../content/v7/devotionals/spurgeon-expansion-01.json');
const sourceItems = [...books.items, ...devotionalSamples.items, ...devotionalExpansion.items];

const FITS = new Set([
  'core_fit',
  'core_fit_with_context',
  'compatible_with_context',
  'tradition_specific_context'
]);
const LEVELS = new Set(['low', 'medium', 'high']);

test('A2 curation is advisory and covers exactly the representative book/devotional candidates', () => {
  assert.equal(curation.schemaVersion, 1);
  assert.equal(curation.advisoryOnly, true);
  assert.equal(curation.publicationApprovalGranted, false);
  assert.equal(curation.items.length, 14);

  const curatedIds = curation.items.map(item => item.contentId);
  assert.equal(new Set(curatedIds).size, curatedIds.length, 'curation IDs must be unique');

  const sourceIds = sourceItems.map(item => item.id);
  assert.deepEqual(new Set(curatedIds), new Set(sourceIds));
  assert.equal(curation.items.some(item => item.contentId.startsWith('past-teaching.')), false);
});

test('A2 enrichment stays revision-bound and complete enough for editorial review', () => {
  const sourceById = new Map(sourceItems.map(item => [item.id, item]));

  for (const item of curation.items) {
    const source = sourceById.get(item.contentId);
    assert.ok(source, `missing source for ${item.contentId}`);
    assert.equal(item.revision, source.revision, `${item.contentId} curation must match source revision`);
    assert.equal(source.publicationState, 'pending_review');
    assert.equal(source.review.status, 'pending_review');

    assert.ok(item.neutralSummary.trim().length >= 40, `${item.contentId} needs a neutral summary`);
    assert.ok(FITS.has(item.theologicalFit), `${item.contentId} has unsupported theological-fit label`);
    assert.ok(Array.isArray(item.reviewFlags));
    assert.ok(item.topics.length >= 2, `${item.contentId} needs useful topic coverage`);
    assert.ok(item.scriptureAnchors.length >= 1, `${item.contentId} needs a Scripture anchor`);
    assert.ok(item.collections.length >= 1, `${item.contentId} needs a collection`);
    assert.ok(item.lifePathways.length >= 1, `${item.contentId} needs a life pathway`);
    assert.ok(item.audience.length >= 1, `${item.contentId} needs an audience`);
    assert.ok(LEVELS.has(item.oneToOneFit));
    assert.ok(LEVELS.has(item.groupFit));
    assert.ok(LEVELS.has(item.editorialPriority));
    assert.ok(LEVELS.has(item.readingPlan.fit));
    assert.ok(Number.isInteger(item.readingPlan.days) && item.readingPlan.days > 0);
    assert.ok(item.readingPlan.mode.trim());
  }
});

test('A2 Scripture anchors use bounded reference-shaped labels instead of embedded verse text', () => {
  const chapterVerseShape = /^(?:[1-3] )?[A-Za-z]+(?: [A-Za-z]+)* \d+:\d+(?:-\d+)?$/;
  const singleChapterShape = /^(?:Obadiah|Philemon|2 John|3 John|Jude) \d+(?:-\d+)?$/;
  for (const item of curation.items) {
    for (const anchor of item.scriptureAnchors) {
      assert.ok(
        chapterVerseShape.test(anchor) || singleChapterShape.test(anchor),
        `${item.contentId} has a malformed Scripture anchor`
      );
      assert.ok(anchor.length < 48, `${item.contentId} anchor should be a reference, not copied verse text`);
    }
  }
});
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseV7ContentBundle } from '../../src/v7/content/contract.js';
import { assessV7DevotionalCatalogTranslationCoverage } from '../../src/v7/content/devotional-translation-policy.js';

const contentFiles = [
  '../../content/v7/devotionals/biblequest-original-emotions-02a.json',
  '../../content/v7/devotionals/biblequest-original-emotions-02b.json',
  '../../content/v7/devotionals/biblequest-original-emotions-02c.json'
];

const EXPECTED_EMOTIONS = [
  'anxiety_worry', 'fear', 'sadness', 'grief_loss', 'loneliness', 'anger',
  'hurt_betrayal', 'rejection', 'guilt', 'shame', 'insecurity_unworthiness',
  'doubt', 'confusion_uncertainty', 'discouragement', 'hopelessness',
  'overwhelm', 'stress', 'tiredness_weariness', 'spiritual_dryness_distance',
  'temptation', 'impatience_waiting', 'jealousy_envy', 'frustration',
  'numbness_emptiness', 'joy', 'gratitude', 'peace_contentment', 'hope',
  'excitement', 'love_connection'
];

const parsedItems = contentFiles.flatMap(path => {
  const raw = JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
  return parseV7ContentBundle(raw).items;
});

const summary = JSON.parse(readFileSync(
  new URL('../../data/v7/curation/release-content-batch-02-summary.json', import.meta.url),
  'utf8'
));

test('Lane A batch 02 adds exactly one second devotional for every launch emotion', () => {
  assert.equal(parsedItems.length, 30);
  assert.ok(parsedItems.every(item => item.id.endsWith('.02')));
  const emotions = parsedItems.flatMap(item =>
    item.taxonomyLinks.filter(link => link.kind === 'emotion').map(link => link.id.slice('emotion.'.length))
  );
  assert.deepEqual([...emotions].sort(), [...EXPECTED_EMOTIONS].sort());
  assert.equal(new Set(parsedItems.map(item => item.id)).size, 30);
  assert.ok(parsedItems.every(item => item.source.kind === 'first_party'));
  assert.ok(parsedItems.every(item => item.rights.status === 'verified'));
  assert.ok(parsedItems.every(item => item.publicationState === 'pending_review'));
});

test('batch 02 keeps complete reviewed current-revision TL, CEB and ILO coverage', () => {
  const report = assessV7DevotionalCatalogTranslationCoverage(parsedItems);
  assert.equal(report.ready, true);
  assert.equal(report.devotionalCount, 30);
  for (const item of parsedItems) {
    assert.deepEqual(
      item.translations.map(row => row.locale).sort(),
      ['ceb', 'fil', 'ilo']
    );
    assert.ok(item.translations.every(row => row.reviewStatus === 'reviewed'));
    assert.ok(item.translations.every(row => row.translatedFromRevision === item.revision));
  }
});

test('batch 02 manifest is complete, checksum-bound and ready for Lane B automated review', () => {
  assert.equal(summary.status, 'ready_for_automated_policy_review');
  assert.equal(summary.counts.devotionals, 30);
  assert.equal(summary.counts.reviewedTranslations, 90);
  assert.equal(summary.counts.verifiedRights, 30);
  assert.equal(summary.counts.pendingPublicationReview, 30);
  assert.equal(summary.items.length, 30);
  assert.equal(summary.bibleVersion, 'BSB');
  assert.equal(summary.qaPolicy.humanReviewRequired, false);

  const byId = new Map(parsedItems.map(item => [item.id, item]));
  for (const row of summary.items) {
    const item = byId.get(row.contentId);
    assert.ok(item, row.contentId);
    const digest = createHash('sha256')
      .update(`${item.sourceContent.title}\n${item.sourceContent.body}`, 'utf8')
      .digest('hex');
    assert.equal(item.source.checksum, `sha256:${digest}`, item.id);
    assert.equal(row.sourceChecksum, item.source.checksum, item.id);
    assert.equal(row.sourceRevision, item.revision, item.id);
    assert.ok(row.bsbReferences.length >= 1, item.id);
    assert.deepEqual(Object.keys(row.qaPass).sort(), ['ceb', 'ilo', 'tl']);
    assert.ok(Object.values(row.qaPass).every(Boolean), item.id);
  }
});

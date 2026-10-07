import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseV7ContentBundle } from '../../src/v7/content/contract.js';
import { assessV7DevotionalCatalogTranslationCoverage } from '../../src/v7/content/devotional-translation-policy.js';

const contentFiles = [
  '../../content/v7/devotionals/biblequest-original-emotions-01a.json',
  '../../content/v7/devotionals/biblequest-original-emotions-01b.json',
  '../../content/v7/devotionals/biblequest-original-emotions-01c.json',
  '../../content/v7/devotionals/biblequest-original-emotions-01d.json',
  '../../content/v7/devotionals/biblequest-original-emotions-01e.json',
  '../../content/v7/devotionals/biblequest-original-emotions-01f.json'
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
  new URL('../../data/v7/curation/release-content-batch-01-summary.json', import.meta.url),
  'utf8'
));

test('Lane A batch 01 contains one first-party release candidate for every launch emotion', () => {
  assert.equal(parsedItems.length, 30);
  assert.deepEqual(
    parsedItems.flatMap(item => item.taxonomyLinks.filter(link => link.kind === 'emotion').map(link => link.id.slice('emotion.'.length))).sort(),
    [...EXPECTED_EMOTIONS].sort()
  );
  assert.ok(parsedItems.every(item => item.source.kind === 'first_party'));
  assert.ok(parsedItems.every(item => item.rights.status === 'verified'));
  assert.ok(parsedItems.every(item => item.publicationState === 'pending_review'));
  assert.ok(parsedItems.every(item => item.review.status === 'pending_review'));
});

test('every batch 01 devotional has reviewed current-revision TL, CEB and ILO translations', () => {
  const report = assessV7DevotionalCatalogTranslationCoverage(parsedItems);
  assert.equal(report.ready, true);
  assert.equal(report.devotionalCount, 30);
  for (const item of parsedItems) {
    assert.equal(item.translations.length, 3, item.id);
    assert.ok(item.translations.every(row => row.reviewStatus === 'reviewed'));
    assert.ok(item.translations.every(row => row.translatedFromRevision === item.revision));
  }
});

test('batch 01 source identity, BSB references and six-dimensional translation QA are revision-bound', () => {
  assert.equal(summary.status, 'ready_for_automated_policy_review');
  assert.equal(summary.bibleVersion, 'BSB');
  assert.equal(summary.counts.devotionals, 30);
  assert.equal(summary.counts.reviewedTranslations, 90);
  assert.deepEqual(summary.contentFiles, contentFiles.map(path => path.replace('../../', '')));
  const byId = new Map(parsedItems.map(item => [item.id, item]));
  for (const qa of summary.items) {
    const item = byId.get(qa.contentId);
    assert.ok(item, qa.contentId);
    const digest = createHash('sha256')
      .update(`${item.sourceContent.title}\n${item.sourceContent.body}`, 'utf8')
      .digest('hex');
    assert.equal(item.source.checksum, `sha256:${digest}`, item.id);
    assert.equal(qa.sourceChecksum, item.source.checksum, item.id);
    assert.equal(qa.sourceRevision, item.revision, item.id);
    assert.equal(qa.entryId, item.id, item.id);
    assert.equal(qa.workId, 'work.biblequest.v7.original-emotion-devotionals', item.id);
    assert.ok(Array.isArray(qa.bsbReferences) && qa.bsbReferences.length > 0, item.id);
    for (const locale of ['tl', 'ceb', 'ilo']) {
      assert.equal(qa.translationRevisions[locale], item.revision, `${item.id}:${locale}:revision`);
      assert.equal(qa.qaPass[locale], true, `${item.id}:${locale}:qa`);
    }
  }
});

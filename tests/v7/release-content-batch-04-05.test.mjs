import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseV7ContentBundle } from '../../src/v7/content/contract.js';
import { assessV7DevotionalCatalogTranslationCoverage } from '../../src/v7/content/devotional-translation-policy.js';

const batches = [
  {
    number: '04',
    files: [
      '../../content/v7/devotionals/biblequest-original-emotions-04a.json',
      '../../content/v7/devotionals/biblequest-original-emotions-04b.json',
      '../../content/v7/devotionals/biblequest-original-emotions-04c.json'
    ],
    summary: '../../data/v7/curation/release-content-batch-04-summary.json',
    expectedCount: 30
  },
  {
    number: '05',
    files: [
      '../../content/v7/devotionals/biblequest-original-emotions-05a.json',
      '../../content/v7/devotionals/biblequest-original-emotions-05b.json',
      '../../content/v7/devotionals/biblequest-original-emotions-05c.json'
    ],
    summary: '../../data/v7/curation/release-content-batch-05-summary.json',
    expectedCount: 24
  }
];

for (const batch of batches) {
  test(`Lane A batch ${batch.number} is contract-valid, translated and checksum-bound`, () => {
    const items = batch.files.flatMap(path => parseV7ContentBundle(JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))).items);
    const summary = JSON.parse(readFileSync(new URL(batch.summary, import.meta.url), 'utf8'));
    assert.equal(items.length, batch.expectedCount);
    assert.equal(new Set(items.map(item => item.id)).size, batch.expectedCount);
    assert.ok(items.every(item => item.id.endsWith(`.${batch.number}`)));
    assert.ok(items.every(item => item.source.kind === 'first_party'));
    assert.ok(items.every(item => item.rights.status === 'verified'));
    assert.ok(items.every(item => item.publicationState === 'pending_review'));

    const report = assessV7DevotionalCatalogTranslationCoverage(items);
    assert.equal(report.ready, true);
    assert.equal(report.devotionalCount, batch.expectedCount);

    assert.equal(summary.status, 'ready_for_automated_policy_review');
    assert.equal(summary.counts.devotionals, batch.expectedCount);
    assert.equal(summary.counts.reviewedTranslations, batch.expectedCount * 3);
    assert.equal(summary.items.length, batch.expectedCount);

    const byId = new Map(items.map(item => [item.id, item]));
    for (const row of summary.items) {
      const item = byId.get(row.contentId);
      assert.ok(item, row.contentId);
      assert.deepEqual(item.translations.map(t => t.locale).sort(), ['ceb', 'fil', 'ilo']);
      assert.ok(item.translations.every(t => t.reviewStatus === 'reviewed'));
      assert.ok(item.translations.every(t => t.translatedFromRevision === item.revision));
      const digest = createHash('sha256').update(`${item.sourceContent.title}\n${item.sourceContent.body}`, 'utf8').digest('hex');
      assert.equal(item.source.checksum, `sha256:${digest}`, item.id);
      assert.equal(row.sourceChecksum, item.source.checksum, item.id);
      assert.ok(row.bsbReferences.length > 0, item.id);
      assert.ok(Object.values(row.qaPass).every(Boolean), item.id);
    }
  });
}

test('Lane A devotional release corpus reaches the 150-item minimum after batches 04 and 05', () => {
  const priorSummaries = ['01', '02', '03'].map(number =>
    JSON.parse(readFileSync(new URL(`../../data/v7/curation/release-content-batch-${number}-summary.json`, import.meta.url), 'utf8'))
  );
  const preFactoryRepresentativeCount = 6;
  const priorFactoryCount = priorSummaries.reduce((count, summary) => count + summary.counts.devotionals, 0);
  const addedCount = batches.reduce((count, batch) => count + batch.expectedCount, 0);
  const total = preFactoryRepresentativeCount + priorFactoryCount + addedCount;
  assert.equal(priorFactoryCount, 90);
  assert.equal(total, 150);
});

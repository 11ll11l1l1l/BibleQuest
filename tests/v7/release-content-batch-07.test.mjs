import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseV7ContentBundle } from '../../src/v7/content/contract.js';
import { assessV7DevotionalCatalogTranslationCoverage } from '../../src/v7/content/devotional-translation-policy.js';

const files = [
  '../../content/v7/devotionals/biblequest-original-emotions-07a.json',
  '../../content/v7/devotionals/biblequest-original-emotions-07b.json',
  '../../content/v7/devotionals/biblequest-original-emotions-07c.json'
];
const items = files.flatMap(path => parseV7ContentBundle(JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))).items);
const summary = JSON.parse(readFileSync(new URL('../../data/v7/curation/release-content-batch-07-summary.json', import.meta.url), 'utf8'));

test('Lane A batch 07 adds 30 automated-review-ready devotionals', () => {
  assert.equal(items.length, 30);
  assert.equal(new Set(items.map(item => item.id)).size, 30);
  assert.ok(items.every(item => item.id.endsWith('.07')));
  assert.ok(items.every(item => item.source.kind === 'first_party'));
  assert.ok(items.every(item => item.rights.status === 'verified'));
  assert.ok(items.every(item => item.publicationState === 'pending_review'));
  const report = assessV7DevotionalCatalogTranslationCoverage(items);
  assert.equal(report.ready, true);
  assert.equal(report.devotionalCount, 30);
});

test('Lane A batch 07 checksum, BSB and translation QA manifests are exact', () => {
  assert.equal(summary.status, 'ready_for_automated_policy_review');
  assert.equal(summary.counts.devotionals, 30);
  assert.equal(summary.counts.reviewedTranslations, 90);
  const byId = new Map(items.map(item => [item.id, item]));
  for (const row of summary.items) {
    const item = byId.get(row.contentId);
    assert.ok(item, row.contentId);
    const digest = createHash('sha256').update(`${item.sourceContent.title}\n${item.sourceContent.body}`, 'utf8').digest('hex');
    assert.equal(item.source.checksum, `sha256:${digest}`, item.id);
    assert.equal(row.sourceChecksum, item.source.checksum, item.id);
    assert.ok(row.bsbReferences.length > 0, item.id);
    assert.deepEqual(item.translations.map(t => t.locale).sort(), ['ceb','fil','ilo']);
    assert.ok(item.translations.every(t => t.reviewStatus === 'reviewed'));
    assert.ok(Object.values(row.qaPass).every(Boolean), item.id);
  }
});

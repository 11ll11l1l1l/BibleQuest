import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { localization, getMissingLocaleKeys } from '../../src/app/localization.js';
import { parseV7ContentBundle } from '../../src/v7/content/contract.js';
import { buildV7ContentReleaseEvidence } from '../../src/v7/content/release-evidence.js';

function readBundle(relativePath) {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
}

function currentItems() {
  return [
    '../../data/v7/books/representative-catalog.json',
    '../../content/v7/devotionals/spurgeon-samples.json',
    '../../data/v7/past-teachings/prayer-source-example.json'
  ].flatMap(path => parseV7ContentBundle(readBundle(path)).items);
}

function uiEvidence() {
  const v7Keys = localization.keyInventory.filter(key => key.startsWith('v7.'));
  return {
    supportedLocales: localization.supportedLocales,
    v7KeyCount: v7Keys.length,
    missingV7KeysByLocale: Object.fromEntries(localization.supportedLocales.map(locale => [
      locale,
      getMissingLocaleKeys(locale).filter(key => key.startsWith('v7.'))
    ]))
  };
}

test('release evidence is deterministic metadata and excludes content bodies', () => {
  const item = {
    id: 'devotional.ready', type: 'devotional', revision: 'r1', sourceLocale: 'en', publicationState: 'published',
    source: { kind: 'external', title: 'Source', uri: 'https://example.test/source', creator: 'Author' },
    sourceContent: { title: 'Title', body: 'SECRET SOURCE BODY' },
    rights: { status: 'verified', holder: 'Holder', basis: 'Basis', attribution: '', allowedUses: ['display'] },
    review: { status: 'approved', reviewer: 'reviewer-1', decidedAt: '2026-10-05T00:00:00Z' },
    translations: [{
      locale: 'tl', translatedFromRevision: 'r1', reviewStatus: 'reviewed', translatedBy: 'translator-1',
      reviewedBy: 'reviewer-2', reviewedAt: '2026-10-05T00:00:00Z', content: { title: 'Pamagat', body: 'SECRET TRANSLATION BODY' }
    }]
  };
  const other = type => ({ ...item, id: `${type}.ready`, type, translations: [] });
  const input = [item, other('book'), other('past_teaching')];
  const options = {
    candidateSha: 'A'.repeat(40),
    supportedLocales: ['tl', 'en'],
    v7KeyCount: 2,
    missingV7KeysByLocale: { en: [], tl: [] }
  };

  const report = buildV7ContentReleaseEvidence({ ...options, items: input });
  const reordered = buildV7ContentReleaseEvidence({ ...options, items: [...input].reverse() });

  assert.equal(report.candidateSha, 'a'.repeat(40));
  assert.equal(report.ready, true);
  assert.equal(report.localization.ready, true);
  assert.deepEqual(report.localization.supportedLocales, ['en', 'tl']);
  assert.equal(report.items[1].translations[0].locale, 'tl');
  assert.deepEqual(reordered.items, report.items);
  const serialized = JSON.stringify(report);
  assert.ok(!serialized.includes('SECRET SOURCE BODY'));
  assert.ok(!serialized.includes('SECRET TRANSLATION BODY'));
  assert.ok(!Object.hasOwn(report.items[1], 'sourceContent'));
});

test('current representative content produces truthful OPEN evidence while V7 UI localization is complete', () => {
  const report = buildV7ContentReleaseEvidence({
    candidateSha: 'b'.repeat(40),
    items: currentItems(),
    ...uiEvidence()
  });

  assert.equal(report.ready, false);
  assert.equal(report.localization.ready, true);
  assert.deepEqual(report.localization.supportedLocales, ['ceb', 'en', 'tl']);
  assert.ok(report.localization.v7KeyCount > 0);
  for (const locale of report.localization.supportedLocales) {
    assert.deepEqual(report.localization.byLocale[locale].missingV7Keys, []);
  }

  assert.deepEqual(report.representative.types.book.blockerCodes, ['review_unapproved', 'not_published']);
  assert.deepEqual(report.representative.types.devotional.blockerCodes, ['review_unapproved', 'not_published']);
  assert.deepEqual(report.representative.types.past_teaching.blockerCodes, [
    'rights_unverified', 'review_unapproved', 'not_published'
  ]);

  const pilgrim = report.items.find(item => item.id === 'books.pilgrims-progress');
  assert.equal(pilgrim.source.catalogId, 'gutenberg:131');
  assert.equal(pilgrim.rights.status, 'verified');
  assert.deepEqual(pilgrim.rights.allowedUses, ['external_link']);
  assert.equal(pilgrim.review.status, 'pending_review');
});

test('release evidence fails closed on incomplete candidate or localization inputs', () => {
  assert.throws(() => buildV7ContentReleaseEvidence({
    candidateSha: 'abc', items: [], supportedLocales: ['en'], v7KeyCount: 1, missingV7KeysByLocale: { en: [] }
  }), /40-character/);
  assert.throws(() => buildV7ContentReleaseEvidence({
    candidateSha: 'c'.repeat(40), items: [], supportedLocales: 'en', v7KeyCount: 1, missingV7KeysByLocale: { en: [] }
  }), /supportedLocales/);
  assert.throws(() => buildV7ContentReleaseEvidence({
    candidateSha: 'c'.repeat(40), items: [], supportedLocales: ['en'], v7KeyCount: 0, missingV7KeysByLocale: { en: [] }
  }), /positive integer/);
  assert.throws(() => buildV7ContentReleaseEvidence({
    candidateSha: 'c'.repeat(40), items: [], supportedLocales: ['en', 'tl'], v7KeyCount: 1,
    missingV7KeysByLocale: { en: [] }
  }), /missingV7KeysByLocale\.tl/);
  assert.throws(() => buildV7ContentReleaseEvidence({
    candidateSha: 'c'.repeat(40), items: [], supportedLocales: ['en'], v7KeyCount: 1,
    missingV7KeysByLocale: { en: 'none' }
  }), /missingV7KeysByLocale\.en/);
});

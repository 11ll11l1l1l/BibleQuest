import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseV7ContentBundle } from '../../src/v7/content/contract.js';
import { assessV7RepresentativeLibraryContent } from '../../src/v7/content/representative-readiness.js';

function readBundle(relativePath) {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
}

function currentRepresentativeItems() {
  const bundles = [
    readBundle('../../data/v7/books/representative-catalog.json'),
    readBundle('../../content/v7/devotionals/spurgeon-samples.json'),
    readBundle('../../data/v7/past-teachings/prayer-source-example.json')
  ];
  return bundles.flatMap(bundle => parseV7ContentBundle(bundle).items);
}

test('representative content gate requires one fully release-ready item per Library type', () => {
  const ready = type => ({
    id: `${type}.ready`,
    type,
    revision: 'r1',
    sourceLocale: 'en',
    publicationState: 'published',
    source: { kind: 'external' },
    rights: { status: 'verified' },
    review: { status: 'approved' }
  });

  const report = assessV7RepresentativeLibraryContent([
    ready('book'),
    ready('devotional'),
    ready('past_teaching')
  ]);

  assert.equal(report.ready, true);
  assert.deepEqual(report.types.book.readyItemIds, ['book.ready']);
  assert.deepEqual(report.types.devotional.blockerCodes, []);
  assert.deepEqual(report.types.past_teaching.blockerCodes, []);
});

test('fixture, rights, review and publication state remain explicit blockers', () => {
  const report = assessV7RepresentativeLibraryContent([
    {
      id: 'book.blocked', type: 'book', revision: 'r1', sourceLocale: 'en', publicationState: 'pending_review',
      source: { kind: 'fixture' }, rights: { status: 'unknown' }, review: { status: 'pending_review' }
    }
  ]);

  assert.equal(report.ready, false);
  assert.deepEqual(report.types.book.blockerCodes, [
    'fixture_source',
    'rights_unverified',
    'review_unapproved',
    'not_published'
  ]);
  assert.deepEqual(report.types.devotional.blockerCodes, ['missing_representative_content']);
  assert.deepEqual(report.types.past_teaching.blockerCodes, ['missing_representative_content']);
});

test('current representative Library content reports the exact unresolved acceptance boundary', () => {
  const report = assessV7RepresentativeLibraryContent(currentRepresentativeItems());

  assert.equal(report.ready, false);

  assert.equal(report.types.book.candidateCount, 2);
  assert.deepEqual(report.types.book.blockerCodes, ['review_unapproved', 'not_published']);

  assert.equal(report.types.devotional.candidateCount, 2);
  assert.deepEqual(report.types.devotional.blockerCodes, ['review_unapproved', 'not_published']);

  assert.equal(report.types.past_teaching.candidateCount, 1);
  assert.deepEqual(report.types.past_teaching.blockerCodes, [
    'rights_unverified',
    'review_unapproved',
    'not_published'
  ]);
});

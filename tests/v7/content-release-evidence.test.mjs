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

function currentReviewEvidence() {
  return {
    reviewPacket: readBundle('../../data/v7/curation/representative-library-review-packet.json'),
    reviewDecisionLedger: readBundle('../../data/v7/curation/representative-library-review-decisions.json')
  };
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

function approvedReviewEvidence(items) {
  const reviewPacket = {
    items: items.map(item => ({
      itemId: item.id,
      contentType: item.type,
      revisionSnapshot: item.revision,
      rightsStatusSnapshot: item.rights.status,
      repositoryEvidenceRefs: [`evidence/${item.id}.json`],
      requiredChecks: ['source_identity', 'publication_suitability']
    }))
  };
  const reviewDecisionLedger = {
    schemaVersion: 1,
    scope: 'v7_representative_library_review_decisions',
    status: 'complete_authorized_decisions',
    boundary: {
      doesNotApproveByPresence: true,
      doesNotPublishContent: true,
      doesNotChangeRights: true,
      authorizedReviewerRequired: true
    },
    decisions: items.map(item => ({
      schemaVersion: 1,
      itemId: item.id,
      revision: item.revision,
      outcome: 'approved',
      reviewer: item.review.reviewer,
      decidedAt: item.review.decidedAt,
      rightsStatusSnapshot: item.rights.status,
      evidenceRefs: [`evidence/${item.id}.json`],
      checks: [
        { id: 'source_identity', result: 'pass' },
        { id: 'publication_suitability', result: 'pass' }
      ]
    }))
  };
  return { reviewPacket, reviewDecisionLedger };
}

test('release evidence is deterministic metadata and includes bound A2 decision evidence without content bodies', () => {
  const item = {
    id: 'devotional.ready', type: 'devotional', revision: 'r1', sourceLocale: 'en', publicationState: 'published',
    source: { kind: 'external', title: 'Source', uri: 'https://example.test/source', creator: 'Author' },
    sourceContent: { title: 'Title', body: 'SECRET SOURCE BODY' },
    rights: { status: 'verified', holder: 'Holder', basis: 'Basis', attribution: '', allowedUses: ['display'] },
    review: { status: 'approved', reviewer: 'reviewer-1', decidedAt: '2026-10-05T00:00:00Z' },
    translations: [
      {
        locale: 'tl', translatedFromRevision: 'r1', reviewStatus: 'reviewed', translatedBy: 'translator-1',
        reviewedBy: 'reviewer-2', reviewedAt: '2026-10-05T00:00:00Z', content: { title: 'Pamagat', body: 'SECRET TRANSLATION BODY' }
      },
      {
        locale: 'ceb', translatedFromRevision: 'r1', reviewStatus: 'reviewed', translatedBy: 'translator-1',
        reviewedBy: 'reviewer-2', reviewedAt: '2026-10-05T00:00:00Z', content: { title: 'Titulo', body: 'SECRET CEBUANO BODY' }
      },
      {
        locale: 'ilo', translatedFromRevision: 'r1', reviewStatus: 'reviewed', translatedBy: 'translator-1',
        reviewedBy: 'reviewer-2', reviewedAt: '2026-10-05T00:00:00Z', content: { title: 'Titulo', body: 'SECRET ILOCANO BODY' }
      }
    ]
  };
  const other = type => ({ ...item, id: `${type}.ready`, type, translations: [] });
  const input = [item, other('book'), other('past_teaching')];
  const options = {
    candidateSha: 'A'.repeat(40),
    ...approvedReviewEvidence(input),
    supportedLocales: ['tl', 'en'],
    v7KeyCount: 2,
    missingV7KeysByLocale: { en: [], tl: [] }
  };

  const report = buildV7ContentReleaseEvidence({ ...options, items: input });
  const reordered = buildV7ContentReleaseEvidence({ ...options, items: [...input].reverse() });

  assert.equal(report.candidateSha, 'a'.repeat(40));
  assert.equal(report.ready, true);
  assert.equal(report.localization.ready, true);
  assert.equal(report.reviewDecisions.status, 'complete_authorized_decisions');
  assert.equal(report.reviewDecisions.decisionCount, 3);
  assert.deepEqual(report.reviewDecisions.approvedItemIds, ['book.ready', 'devotional.ready', 'past_teaching.ready']);
  assert.deepEqual(report.localization.supportedLocales, ['en', 'tl']);
  const devotional = report.items.find(reportItem => reportItem.id === 'devotional.ready');
  assert.deepEqual(devotional.translations.map(entry => entry.locale), ['ceb', 'ilo', 'tl']);
  assert.deepEqual(reordered.items, report.items);
  assert.deepEqual(reordered.reviewDecisions, report.reviewDecisions);
  const serialized = JSON.stringify(report);
  assert.ok(!serialized.includes('SECRET SOURCE BODY'));
  assert.ok(!serialized.includes('SECRET TRANSLATION BODY'));
  assert.ok(!serialized.includes('SECRET CEBUANO BODY'));
  assert.ok(!serialized.includes('SECRET ILOCANO BODY'));
  assert.ok(!Object.hasOwn(devotional, 'sourceContent'));
});

test('current representative content produces truthful OPEN evidence with A2 decisions explicitly awaiting review', () => {
  const report = buildV7ContentReleaseEvidence({
    candidateSha: 'b'.repeat(40),
    items: currentItems(),
    ...currentReviewEvidence(),
    ...uiEvidence()
  });

  assert.equal(report.ready, false);
  assert.equal(report.reviewDecisions.status, 'awaiting_authorized_decisions');
  assert.equal(report.reviewDecisions.decisionCount, 0);
  assert.equal(report.reviewDecisions.representativeItemCount, 5);
  assert.deepEqual(report.reviewDecisions.approvedItemIds, []);
  assert.deepEqual(report.reviewDecisions.rejectedItemIds, []);
  assert.equal(report.localization.ready, true);
  assert.deepEqual(report.localization.supportedLocales, ['ceb', 'en', 'tl']);
  assert.ok(report.localization.v7KeyCount > 0);
  for (const locale of report.localization.supportedLocales) {
    assert.deepEqual(report.localization.byLocale[locale].missingV7Keys, []);
  }

  assert.deepEqual(report.representative.types.book.blockerCodes, ['review_unapproved', 'not_published']);
  assert.deepEqual(report.representative.types.devotional.blockerCodes, ['review_unapproved', 'not_published']);
  assert.deepEqual(report.representative.types.past_teaching.blockerCodes, [
    'review_unapproved', 'not_published'
  ]);

  const pilgrim = report.items.find(item => item.id === 'books.pilgrims-progress');
  assert.equal(pilgrim.source.catalogId, 'gutenberg:131');
  assert.equal(pilgrim.rights.status, 'verified');
  assert.deepEqual(pilgrim.rights.allowedUses, ['external_link']);
  assert.equal(pilgrim.review.status, 'pending_review');
});

test('release evidence fails closed when A2 packet/ledger do not match the exact candidate content', () => {
  const items = currentItems();
  const { reviewPacket, reviewDecisionLedger } = currentReviewEvidence();

  const incompletePacket = { ...reviewPacket, items: reviewPacket.items.slice(1) };
  assert.throws(() => buildV7ContentReleaseEvidence({
    candidateSha: 'c'.repeat(40), items, reviewPacket: incompletePacket, reviewDecisionLedger, ...uiEvidence()
  }), /cover every release-evidence item exactly once/);

  const unexpectedDecision = {
    ...reviewDecisionLedger,
    status: 'partial_authorized_decisions',
    decisions: [{
      schemaVersion: 1,
      itemId: 'books.pilgrims-progress',
      revision: 'books.pilgrims-progress.r1',
      outcome: 'approved',
      reviewer: 'unauthorized-test-fixture',
      decidedAt: '2026-10-06T00:00:00Z',
      rightsStatusSnapshot: 'verified',
      evidenceRefs: [...reviewPacket.items[0].repositoryEvidenceRefs],
      checks: reviewPacket.items[0].requiredChecks.map(id => ({ id, result: 'pass' }))
    }]
  };
  assert.throws(() => buildV7ContentReleaseEvidence({
    candidateSha: 'd'.repeat(40), items, reviewPacket, reviewDecisionLedger: unexpectedDecision, ...uiEvidence()
  }), /canonical review state to be updated atomically/);
});

test('release evidence fails closed on incomplete candidate or localization inputs', () => {
  const reviewEvidence = currentReviewEvidence();
  assert.throws(() => buildV7ContentReleaseEvidence({
    candidateSha: 'abc', items: [], ...reviewEvidence, supportedLocales: ['en'], v7KeyCount: 1, missingV7KeysByLocale: { en: [] }
  }), /40-character/);
  assert.throws(() => buildV7ContentReleaseEvidence({
    candidateSha: 'c'.repeat(40), items: [], reviewPacket: { items: [] }, reviewDecisionLedger: { ...reviewEvidence.reviewDecisionLedger },
    supportedLocales: 'en', v7KeyCount: 1, missingV7KeysByLocale: { en: [] }
  }), /supportedLocales/);
  assert.throws(() => buildV7ContentReleaseEvidence({
    candidateSha: 'c'.repeat(40), items: [], reviewPacket: { items: [] }, reviewDecisionLedger: { ...reviewEvidence.reviewDecisionLedger },
    supportedLocales: ['en'], v7KeyCount: 0, missingV7KeysByLocale: { en: [] }
  }), /positive integer/);
  assert.throws(() => buildV7ContentReleaseEvidence({
    candidateSha: 'c'.repeat(40), items: [], reviewPacket: { items: [] }, reviewDecisionLedger: { ...reviewEvidence.reviewDecisionLedger },
    supportedLocales: ['en', 'tl'], v7KeyCount: 1, missingV7KeysByLocale: { en: [] }
  }), /missingV7KeysByLocale\.tl/);
  assert.throws(() => buildV7ContentReleaseEvidence({
    candidateSha: 'c'.repeat(40), items: [], reviewPacket: { items: [] }, reviewDecisionLedger: { ...reviewEvidence.reviewDecisionLedger },
    supportedLocales: ['en'], v7KeyCount: 1, missingV7KeysByLocale: { en: 'none' }
  }), /missingV7KeysByLocale\.en/);
});

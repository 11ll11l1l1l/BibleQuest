import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseV7ContentBundle } from '../../src/v7/content/contract.js';
import {
  assessV7DevotionalCatalogTranslationCoverage,
  assessV7DevotionalTranslationCoverage,
  V7_DEVOTIONAL_TRANSLATION_RULEBOOK_VERSION,
  V7_REQUIRED_DEVOTIONAL_TRANSLATION_LOCALES
} from '../../src/v7/content/devotional-translation-policy.js';

const translation = (locale, patch = {}) => ({
  locale,
  translatedFromRevision: 'r1',
  translatedBy: 'OpenAI GPT-5.6 Sol — BibleQuest V7',
  reviewStatus: 'reviewed',
  reviewedBy: 'BibleQuest AI translation QA — Rulebook v1.0',
  reviewedAt: '2026-10-06T10:19:00Z',
  content: { title: `Title ${locale}`, body: `Body ${locale}` },
  ...patch
});

const devotional = translations => ({
  id: 'devotional.test',
  type: 'devotional',
  revision: 'r1',
  sourceLocale: 'en',
  translations
});

test('V7 rulebook requires Tagalog, Cebuano and Ilocano', () => {
  assert.equal(V7_DEVOTIONAL_TRANSLATION_RULEBOOK_VERSION, '1.0');
  assert.deepEqual(V7_REQUIRED_DEVOTIONAL_TRANSLATION_LOCALES, ['tl', 'ceb', 'ilo']);
});

test('complete reviewed current-revision coverage passes', () => {
  const report = assessV7DevotionalTranslationCoverage(devotional([
    translation('tl'), translation('ceb'), translation('ilo')
  ]));
  assert.equal(report.ready, true);
  assert.equal(report.targets.tl.canonicalLocale, 'fil');
  assert.equal(report.targets.ceb.ready, true);
  assert.equal(report.targets.ilo.ready, true);
});

test('coverage fails closed for missing, stale, draft or bodyless translations', () => {
  const missing = assessV7DevotionalTranslationCoverage(devotional([
    translation('tl'), translation('ceb')
  ]));
  assert.deepEqual(missing.targets.ilo.blockers, ['missing_translation']);

  const stale = assessV7DevotionalTranslationCoverage(devotional([
    translation('tl', { translatedFromRevision: 'r0' }), translation('ceb'), translation('ilo')
  ]));
  assert.deepEqual(stale.targets.tl.blockers, ['stale_revision']);

  const draft = assessV7DevotionalTranslationCoverage(devotional([
    translation('tl'), translation('ceb', { reviewStatus: 'draft' }), translation('ilo')
  ]));
  assert.deepEqual(draft.targets.ceb.blockers, ['not_reviewed']);

  const bodyless = assessV7DevotionalTranslationCoverage(devotional([
    translation('tl'), translation('ceb'), translation('ilo', { content: { title: 'Titulo', body: '   ' } })
  ]));
  assert.deepEqual(bodyless.targets.ilo.blockers, ['missing_body']);
});

test('representative Spurgeon bundle is translation-complete while editorial publication remains separate', () => {
  const bundle = JSON.parse(readFileSync(new URL('../../content/v7/devotionals/spurgeon-samples.json', import.meta.url), 'utf8'));
  const parsed = parseV7ContentBundle(bundle);
  const report = assessV7DevotionalCatalogTranslationCoverage(parsed.items);
  assert.equal(report.devotionalCount, 2);
  assert.equal(report.ready, true);
  assert.ok(parsed.items.every(item => item.publicationState === 'pending_review'));
  for (const item of report.items) {
    assert.equal(item.ready, true);
    assert.deepEqual(Object.keys(item.targets), ['tl', 'ceb', 'ilo']);
  }
});

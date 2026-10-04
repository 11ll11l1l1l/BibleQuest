import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  V7ContentContractError,
  parseV7ContentBundle,
  resolveV7Content,
  V7_CONTENT_TYPES
} from '../../src/v7/content/contract.js';

const fixture = JSON.parse(await readFile(new URL('../../data/v7/content-fixtures/representative-library.json', import.meta.url), 'utf8'));

test('representative fixture parses all three Library content types as unpublished synthetic examples', () => {
  const bundle = parseV7ContentBundle(fixture);
  assert.deepEqual(V7_CONTENT_TYPES, ['book', 'devotional', 'past_teaching']);
  assert.deepEqual(bundle.items.map(item => item.type).sort(), [...V7_CONTENT_TYPES]);
  assert.ok(bundle.items.every(item => item.publicationState === 'draft' && item.rights.status === 'unknown'));
});

test('unknown rights cannot be marked published', () => {
  const input = structuredClone(fixture);
  input.items[0].publicationState = 'published';
  assert.throws(() => parseV7ContentBundle(input), error => error instanceof V7ContentContractError && error.code === 'unverified_rights_published');
});

test('publication requires verified rights and an approved review record', () => {
  const input = structuredClone(fixture);
  const item = input.items[0];
  item.source = { kind: 'external', title: 'Catalog source', uri: 'https://example.org/book', revision: 'catalog-r1' };
  item.rights = { status: 'verified', holder: 'Example author', basis: 'Written permission on file', attribution: 'By Example author', allowedUses: ['display metadata', 'link to source'] };
  item.review = { status: 'approved', reviewer: 'Content reviewer', decidedAt: '2026-10-01T12:00:00Z' };
  item.publicationState = 'published';
  assert.equal(parseV7ContentBundle(input).items[0].publicationState, 'published');
  item.rights.allowedUses = [];
  assert.throws(() => parseV7ContentBundle(input), error => error.code === 'rights_uses');
  item.rights.allowedUses = ['display metadata', 'link to source'];
  item.review.status = 'pending_review';
  assert.throws(() => parseV7ContentBundle(input), error => error.code === 'publication_review');
  item.review.status = 'approved';
  item.rights.holder = '';
  assert.throws(() => parseV7ContentBundle(input), error => error.code === 'required');
});

test('taxonomy links must resolve to controlled terms and preserve explicit order', () => {
  const input = structuredClone(fixture);
  input.items[1].taxonomyLinks.reverse();
  const item = parseV7ContentBundle(input).items.find(row => row.id === 'fixture.devotional-one');
  assert.deepEqual(item.taxonomyLinks.map(row => row.kind), ['category', 'topic']);
  input.items[1].taxonomyLinks[0].id = 'unregistered.topic';
  assert.throws(() => parseV7ContentBundle(input), error => error.code === 'unknown_taxonomy');
});

test('translation selection reports source-language fallback instead of fabricating a translation', () => {
  const item = parseV7ContentBundle(fixture).items[0];
  const result = resolveV7Content(item, 'ilo');
  assert.equal(result.state, 'source_fallback');
  assert.equal(result.locale, 'en');
  assert.equal(result.content.title, 'Fixture Book — do not publish');
});

test('only reviewed translations for the current revision can be selected', () => {
  const input = structuredClone(fixture);
  input.items[0].translations = [{ locale: 'tl', translatedFromRevision: 'fixture-r1', translatedBy: 'Fixture editor', reviewStatus: 'draft', content: { title: 'Hindi pa nasusuri' } }];
  const item = parseV7ContentBundle(input).items[0];
  assert.equal(resolveV7Content(item, 'tl').state, 'source_fallback');
  input.items[0].translations[0].reviewStatus = 'reviewed';
  input.items[0].translations[0].reviewedBy = 'Language reviewer';
  input.items[0].translations[0].reviewedAt = '2026-10-01T12:00:00Z';
  assert.equal(resolveV7Content(parseV7ContentBundle(input).items[0], 'tl').state, 'translated');
});

test('withdrawn content requires a reason and stable derivative references', () => {
  const input = structuredClone(fixture);
  input.items[0].publicationState = 'withdrawn';
  assert.throws(() => parseV7ContentBundle(input), error => error.code === 'withdrawal');
  input.items[0].withdrawal = { reason: 'Rights review pending', decidedAt: '2026-10-01T12:00:00Z' };
  input.items[0].derivatives = ['fixture.derivative'];
  assert.deepEqual(parseV7ContentBundle(input).items[0].derivatives, ['fixture.derivative']);
});

test('locale tags are canonicalized and malformed tags fail closed', () => {
  const input = structuredClone(fixture);
  input.items[0].sourceLocale = 'EN-us';
  assert.equal(parseV7ContentBundle(input).items[0].sourceLocale, 'en-US');
  input.items[0].sourceLocale = 'not a locale';
  assert.throws(() => parseV7ContentBundle(input), error => error.code === 'locale');
});

test('taxonomy locale aliases fail instead of silently overwriting a label', () => {
  const input = structuredClone(fixture);
  input.taxonomy[0].labels = { 'en-US': 'Original label', 'EN-us': 'Conflicting label' };
  assert.throws(() => parseV7ContentBundle(input),
    error => error.code === 'duplicate_taxonomy_locale' && error.path === 'taxonomy[0].labels.EN-us');
});

test('resolver does not expose reviewed translations from an older source revision', () => {
  const item = parseV7ContentBundle(fixture).items[0];
  const changedItem = { ...item, revision: 'fixture-r2', translations: [
    { locale: 'fil', reviewStatus: 'reviewed', translatedFromRevision: 'fixture-r1', content: { title: 'Old translation' } }
  ] };
  const result = resolveV7Content(changedItem, 'tl');
  assert.equal(result.state, 'source_fallback');
  assert.equal(result.locale, 'en');
  assert.equal(result.content, item.sourceContent);
  changedItem.translations[0].translatedFromRevision = 'fixture-r2';
  assert.equal(resolveV7Content(changedItem, 'tl').state, 'translated');
});

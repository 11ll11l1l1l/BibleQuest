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

function translatedFixture(revision, locale = 'ja', reviewStatus = 'reviewed') {
  return { locale, translatedFromRevision: revision, translatedBy: 'Fixture translator',
    reviewStatus, ...(reviewStatus === 'reviewed' ? { reviewedBy: 'Fixture reviewer', reviewedAt: '2026-10-01T12:00:00Z' } : {}),
    content: { title: 'Historical fixture translation', body: 'Retained translation body.' } };
}

test('source revision updates preserve historical translations without selecting stale content', () => {
  const input = structuredClone(fixture);
  input.items[0].revision = 'fixture-r2';
  input.items[0].revisionHistory = [' fixture-r1 '];
  input.items[0].translations = [translatedFixture('fixture-r1')];
  const item = parseV7ContentBundle(input).items[0];
  assert.deepEqual(item.revisionHistory, ['fixture-r1']);
  assert.equal(item.translations[0].content.body, 'Retained translation body.');
  assert.equal(item.translations[0].translatedFromRevision, 'fixture-r1');
  assert.equal(resolveV7Content(item, 'ja').state, 'source_fallback');
  assert.deepEqual(parseV7ContentBundle(JSON.parse(JSON.stringify(parseV7ContentBundle(input)))), parseV7ContentBundle(input));
});

test('current and historical translations may share a locale but only the current one resolves', () => {
  const input = structuredClone(fixture);
  input.items[0].revision = 'fixture-r2';
  input.items[0].revisionHistory = ['fixture-r1'];
  input.items[0].translations = [translatedFixture('fixture-r1'), translatedFixture('fixture-r2')];
  input.items[0].translations[1].content.title = 'Current fixture translation';
  const item = parseV7ContentBundle(input).items[0];
  assert.equal(item.translations.length, 2);
  assert.equal(resolveV7Content(item, 'ja').content.title, 'Current fixture translation');
  input.items[0].translations.push(translatedFixture('fixture-r2', 'JA'));
  assert.throws(() => parseV7ContentBundle(input), error => error.code === 'duplicate_translation');
});

test('undeclared translation revisions fail without discarding their records', () => {
  const input = structuredClone(fixture);
  input.items[0].translations = [translatedFixture('missing-revision')];
  assert.throws(() => parseV7ContentBundle(input), error => error.code === 'translation_revision');
  assert.equal(input.items[0].translations[0].translatedFromRevision, 'missing-revision');
});

test('revision history detects normalized self-references and duplicate IDs', () => {
  const input = structuredClone(fixture);
  for (const history of [[' fixture-r1 '], ['earlier-r0', ' earlier-r0 ']]) {
    input.items[0].revisionHistory = history;
    assert.throws(() => parseV7ContentBundle(input), error => error.code === 'revision_history');
  }
});

test('published current translations remain reviewed while historical drafts stay preserved and unselectable', () => {
  const input = structuredClone(fixture);
  const item = input.items[0];
  item.revision = 'fixture-r2';
  item.revisionHistory = ['fixture-r1'];
  item.source = { kind: 'external', title: 'Fixture catalog reference', uri: 'https://example.org/fixture' };
  item.rights = { status: 'verified', holder: 'Fixture holder', basis: 'Synthetic test permission', attribution: '', allowedUses: ['display metadata'] };
  item.review = { status: 'approved', reviewer: 'Fixture reviewer', decidedAt: '2026-10-01T12:00:00Z' };
  item.publicationState = 'published';
  item.translations = [translatedFixture('fixture-r1', 'ja', 'draft')];
  const parsed = parseV7ContentBundle(input).items[0];
  assert.equal(parsed.translations[0].reviewStatus, 'draft');
  assert.equal(resolveV7Content(parsed, 'ja').state, 'source_fallback');
  item.translations.push(translatedFixture('fixture-r2', 'ja', 'draft'));
  assert.throws(() => parseV7ContentBundle(input), error => error.code === 'unreviewed_translation_published');
});

test('unsupported import fields report their exact path instead of silently discarding data', () => {
  const cases = [
    ['bundle.extra', input => { input.extra = { preserve: 'bundle metadata' }; }],
    ['taxonomy[0].extra', input => { input.taxonomy[0].extra = 'term metadata'; }],
    ['items[0].extra', input => { input.items[0].extra = 'item metadata'; }],
    ['items[0].source.extra', input => { input.items[0].source.extra = 'source evidence'; }],
    ['items[0].sourceContent.extra', input => { input.items[0].sourceContent.extra = 'content blocks'; }],
    ['items[0].review.extra', input => { input.items[0].review.extra = 'review evidence'; }],
    ['items[0].taxonomyLinks[0].extra', input => { input.items[0].taxonomyLinks[0].extra = 'link metadata'; }],
    ['items[0].translations[0].extra', input => {
      input.items[0].translations = [{ ...translatedFixture('fixture-r1'), extra: 'translation metadata' }];
    }],
    ['items[0].translations[0].content.extra', input => {
      input.items[0].translations = [translatedFixture('fixture-r1')];
      input.items[0].translations[0].content.extra = 'translated blocks';
    }],
  ];
  for (const [path, mutate] of cases) {
    const input = structuredClone(fixture);
    mutate(input);
    const before = structuredClone(input);
    assert.throws(() => parseV7ContentBundle(input),
      error => error instanceof V7ContentContractError && error.code === 'unknown_field' && error.path === path,
      path);
    assert.deepEqual(input, before, path + ' leaves source data intact');
  }
});

test('recognized source provenance survives normalization and a JSON round trip', () => {
  const input = structuredClone(fixture);
  input.items[0].source = { kind: 'external', title: 'Fixture source', uri: 'https://example.org/fixture',
    catalogId: 'fixture:catalog:1', revision: 'source-r1', date: '2026-10-01T12:00:00Z',
    checksum: 'fixture-checksum', creator: 'Fixture author', organization: 'Fixture organization' };
  const parsed = parseV7ContentBundle(input);
  assert.deepEqual(parsed.items[0].source, input.items[0].source);
  assert.deepEqual(parseV7ContentBundle(JSON.parse(JSON.stringify(parsed))), parsed);
});

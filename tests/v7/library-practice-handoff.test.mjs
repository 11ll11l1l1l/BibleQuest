import test from 'node:test';
import assert from 'node:assert/strict';
import { libraryPracticeRecommendations, renderLibraryPracticeHandoff } from '../../src/features/library/practice-handoff.js';
import { createLibraryItemPage } from '../../src/features/library/item-page.js';
import { PRACTICES, DISCIPLINE_GUIDES } from '../../src/features/spiritual-practices/content.js';
import { buildV7PublicLibraryCatalog } from '../../scripts/v7-generate-public-library-catalog.mjs';

const item = overrides => ({
  id: 'private-id', contentType: 'devotional', publishedRevisionId: 'r1', publicationState: 'published', title: 'PRIVATE_TITLE', sourceLocale: 'en', locale: 'en',
  source: { kind: 'first_party', title: 'Original', catalogId: 'original-reading' }, sourceContent: { title: 'PRIVATE_TITLE', body: 'PRIVATE_BODY' },
  rights: { status: 'verified', holder: 'BibleQuest', basis: 'Original', attribution: 'BibleQuest', allowedUses: ['display'] },
  review: { status: 'approved', reviewer: 'editor', decidedAt: '2026-10-18T00:00:00Z' }, translations: [],
  taxonomyLinks: [{ id: 'topic.community', kind: 'topic', order: 0 }], ...overrides,
});
test('practice links require published reviewed rights-valid readings and explicit public topics', () => {
  assert.deepEqual(libraryPracticeRecommendations(item()).map(row => row.id), ['fellowship']);
  for (const patch of [{ publicationState: 'draft' }, { review: { status: 'pending_review' } }, { rights: { status: 'unknown' } }, { contentType: 'book' }, { taxonomyLinks: [] }, { taxonomyLinks: [{ id: 'topic.unknown', kind: 'topic', order: 0 }] }, { taxonomyLinks: [{ id: 'topic.community', kind: 'emotion', order: 0 }] }]) assert.equal(renderLibraryPracticeHandoff(item(patch)), '');
  assert.equal(renderLibraryPracticeHandoff(item({ rights: { ...item().rights, allowedUses: ['external_link'] } })), '');
});
test('links are bounded, deduplicated canonical IDs with no reading or private fields', () => {
  const topics = ['prayer', 'life-in-christ', 'trust', 'community', 'love'];
  const record = item({ taxonomyLinks: topics.map((id, order) => ({ id: `topic.${id}`, kind: 'topic', order })) });
  const ids = libraryPracticeRecommendations(record).map(row => row.id);
  assert.deepEqual(ids, ['morning-10', 'silencio-10', 'fellowship']);
  assert.ok(ids.every(id => [...PRACTICES, ...DISCIPLINE_GUIDES].some(row => row.id === id)));
  const html = renderLibraryPracticeHandoff(record);
  assert.doesNotMatch(html, /PRIVATE_TITLE|PRIVATE_BODY|private-id/);
  assert.deepEqual([...html.matchAll(/href="([^"]+)"/g)].map(match => match[1]), ids.map(id => `#/spiritual-practices?practice=${id}`));
  for (const [locale, label] of [['en', 'Put this into practice'], ['tl', 'Isabuhay ito'], ['ceb', 'Ikinabuhi kini'], ['ilo', 'Put this into practice'], ['__proto__', 'Put this into practice']]) assert.ok(renderLibraryPracticeHandoff(record, locale).includes(label));
});
test('real public catalog yields contextual links without changing publication or source', async () => {
  const catalog = await buildV7PublicLibraryCatalog({ candidateSha: 'a'.repeat(40), generatedAt: '2026-11-01T00:00:00Z' });
  const before = JSON.stringify(catalog);
  assert.deepEqual(libraryPracticeRecommendations(catalog.items.find(row => row.id === 'devotional.biblequest.loneliness.01')).map(row => row.id), ['fellowship']);
  assert.ok(libraryPracticeRecommendations(catalog.items.find(row => row.id === 'devotional.biblequest.anxiety_worry.01')).some(row => row.id === 'morning-10'));
  assert.equal(JSON.stringify(catalog), before);
});
test('actual Library item rendering exposes handoff and clears it when context resets', () => {
  let render, markup = '';
  const host = { get innerHTML() { return markup; }, set innerHTML(value) { markup = value; }, set textContent(value) { markup = value; }, setAttribute() {}, focus() {} };
  const button = { addEventListener() {}, removeEventListener() {} };
  const service = { subscribe: fn => { render = fn; return () => {}; }, getItem() {}, reset() {} };
  const dispose = createLibraryItemPage({ service, id: 'public', onBack() {} }).mount({ querySelector: selector => selector === '[data-library-detail]' ? host : button });
  render({ status: 'ready', selectedItem: item({ contentType: 'past_teaching' }) });
  assert.match(host.innerHTML, /data-library-practice="fellowship"/);
  assert.match(host.innerHTML, /data-library-conversation/);
  render({ status: 'idle' });
  assert.doesNotMatch(host.innerHTML, /data-library-practice|data-library-conversation/);
  dispose();
});

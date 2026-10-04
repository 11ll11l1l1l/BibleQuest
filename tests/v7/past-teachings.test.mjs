import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderPastTeachingArticle } from '../../src/features/past-teachings/article.js';
import { parseV7ContentBundle } from '../../src/v7/content/contract.js';
import { createLibraryItemPage } from '../../src/features/library/item-page.js';
function item(patch = {}) {
  return { contentType: 'past_teaching', publicationState: 'published', review: { status: 'approved' }, publishedRevisionId: 'r1', sourceLocale: 'en',
    source: { uri: 'https://example.test/sermon', creator: 'Original preacher', date: '1888-01-08T00:00:00Z' },
    sourceContent: { title: 'Teaching', body: '## A heading\n\nFirst paragraph.\nSecond line.' },
    rights: { status: 'verified', allowedUses: ['display'] }, translations: [], ...patch };
}
test('teaching renders readable sections, source identity and safe original-source link', () => {
  const html = renderPastTeachingArticle(item(), { locale: 'en' });
  assert.match(html, /<h2>A heading<\/h2>/);
  assert.match(html, /First paragraph\.<br>Second line\./);
  assert.match(html, /lang="en"/);
  assert.match(html, /Original preacher/);
  assert.match(html, /1888-01-08/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /Adapted article/);
});
test('article markup and untrusted URLs cannot execute or embed content', () => {
  const html = renderPastTeachingArticle(item({ source: { uri: 'javascript:alert(1)', creator: '<script>bad</script>' },
    sourceContent: { title: '" onmouseover="bad', body: '<img src=x onerror=bad>\n\n## <script>bad</script>' } }), { locale: 'en' });
  assert.doesNotMatch(html, /<img|<script|href="javascript:/);
  assert.match(html, /&lt;img/);
  assert.match(html, /&quot; onmouseover=&quot;bad/);
  assert.doesNotMatch(renderPastTeachingArticle(item({ source: { uri: 'https://secret@example.test' } })), /<a /);
});
test('only reviewed current-revision translations render; source fallback is labelled', () => {
  const translation = { locale: 'fil', translatedFromRevision: 'r1', reviewStatus: 'reviewed', content: { title: 'Panalangin', body: 'Isang aral.' } };
  const translated = renderPastTeachingArticle(item({ translations: [translation] }), { locale: 'tl' });
  assert.match(translated, /lang="fil"/);
  assert.match(translated, /Isang aral/);
  assert.match(translated, /<h2>Panalangin<\/h2>/);
  const fallback = renderPastTeachingArticle(item({ translations: [{ ...translation, translatedFromRevision: 'r0' }] }), { locale: 'tl' });
  assert.match(fallback, /Showing the source language: en/);
  assert.doesNotMatch(fallback, /Isang aral/);
});
test('link-only rights and unsupported/oversized bodies do not expose an article', () => {
  assert.match(renderPastTeachingArticle(item({ publicationState: 'pending_review' })), /not permitted/);
  assert.match(renderPastTeachingArticle(item({ rights: { status: 'verified', allowedUses: ['link'] } })), /not permitted/);
  assert.match(renderPastTeachingArticle(item({ sourceContent: { title: 'Title', body: { blocks: [{ type: 'embed', text: 'bad' }] } } })), /unavailable/);
  assert.match(renderPastTeachingArticle(item({ sourceContent: { title: 'Title', body: 'x'.repeat(100001) } })), /unavailable/);
  assert.equal(renderPastTeachingArticle(item({ contentType: 'book' })), '');
});
test('database structured paragraphs render without allowing raw HTML', () => {
  const html = renderPastTeachingArticle(item({ sourceContent: { title: 'Title', body: { blocks: [{ type: 'heading', text: 'Section' }, { type: 'paragraph', text: '<b>Text</b>' }] } } }));
  assert.match(html, /<h2>Section<\/h2>/);
  assert.match(html, /&lt;b&gt;Text/);
});
test('source-backed adaptation remains pending with no fabricated rights or publication approval', async () => {
  const bundle = parseV7ContentBundle(JSON.parse(await readFile(new URL('../../data/v7/past-teachings/prayer-source-example.json', import.meta.url), 'utf8')));
  const teaching = bundle.items[0];
  assert.equal(teaching.type, 'past_teaching');
  assert.equal(teaching.source.kind, 'external');
  assert.equal(teaching.publicationState, 'pending_review');
  assert.equal(teaching.review.status, 'pending_review');
  assert.equal(teaching.rights.status, 'unknown');
  assert.match(teaching.sourceContent.body, /John 15:7/);
  assert.match(teaching.source.uri, /spurgeon\.org/);
});
test('shared detail route includes the teaching article and clears it on context invalidation', () => {
  let listener;
  const host = { innerHTML: '', set textContent(value) { this.innerHTML = value; } };
  const button = { addEventListener() {}, removeEventListener() {} };
  const service = { subscribe(fn) { listener = fn; return () => {}; }, getItem() {} };
  createLibraryItemPage({ service, id: 'teaching', onBack() {} }).mount({ querySelector: selector => selector === '[data-library-detail]' ? host : button });
  listener({ status: 'ready', selectedItem: { ...item(), title: 'Teaching', summary: 'Summary', source: { title: 'Original' }, rights: { status: 'verified', allowedUses: ['display'], attribution: 'Author', basis: 'Permission' } } });
  assert.match(host.innerHTML, /<article/);
  listener({ status: 'idle' });
  assert.doesNotMatch(host.innerHTML, /<article|First paragraph/);
});

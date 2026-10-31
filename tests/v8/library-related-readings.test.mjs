import test from 'node:test';
import assert from 'node:assert/strict';
import { relatedLibraryTopics, findRelatedPublishedReadings } from '../../src/features/library/related-readings.js';
import { createLibraryService } from '../../src/features/library/service.js';
import { createLibraryItemPage } from '../../src/features/library/item-page.js';

const item = (id, patch = {}) => ({
  id, contentType: 'devotional', publishedRevisionId: 'r1', publicationState: 'published', title: id,
  sourceLocale: 'en', locale: 'en',
  source: { kind: 'first_party', title: 'Source', catalogId: id },
  sourceContent: { title: id, body: 'PRIVATE_REFLECTION_NEVER_SHARED' },
  rights: { status: 'verified', holder: 'BibleQuest', basis: 'Original', attribution: 'BibleQuest', allowedUses: ['display'] },
  review: { status: 'approved', reviewer: 'editor', decidedAt: '2026-10-18T00:00:00Z' },
  taxonomyLinks: [{ id: 'topic.prayer', kind: 'topic', order: 0 }], translations: [], ...patch,
});

test('related readings only use verified published display-licensed topics', () => {
  assert.deepEqual(relatedLibraryTopics(item('one')), ['topic.prayer']);
  for (const patch of [
    { publicationState: 'draft' }, { contentType: 'book' },
    { review: { status: 'pending' } }, { rights: { status: 'unknown' } },
    { rights: { ...item('one').rights, allowedUses: ['external_link'] } },
    { taxonomyLinks: [{ id: 'emotion.anxiety', kind: 'emotion', order: 0 }] },
  ]) assert.deepEqual(relatedLibraryTopics(item('one', patch)), []);
});

test('bounded queries reject unreviewed, mismatched, book and duplicate records', async () => {
  const requests = [];
  const current = item('current', { taxonomyLinks: [
    { id: 'topic.prayer', kind: 'topic', order: 0 },
    { id: 'topic.trust', kind: 'topic', order: 1 },
    { id: 'topic.love', kind: 'topic', order: 2 },
  ] });
  const both = item('both', { taxonomyLinks: [
    { id: 'topic.prayer', kind: 'topic', order: 0 },
    { id: 'topic.trust', kind: 'topic', order: 1 },
  ] });
  const only = item('only', { title: '<strong>Published</strong>' });
  const bad = item('bad', { review: { status: 'pending' } });
  const repo = { async listPublished(request) {
    requests.push(request);
    return { items: request.taxonomyId === 'topic.prayer'
      ? [current, only, bad, both, item('book', { contentType: 'book' }), item('wrong', { taxonomyLinks: [] })]
      : [only, both] };
  } };
  const rows = await findRelatedPublishedReadings(repo, current);
  assert.deepEqual(requests, [
    { taxonomyId: 'topic.prayer', limit: 12 }, { taxonomyId: 'topic.trust', limit: 12 },
  ]);
  assert.deepEqual(rows.map(row => row.id), ['both', 'only']);
  assert.equal(rows[0].matched, undefined);
  assert.doesNotMatch(JSON.stringify(rows), /PRIVATE_REFLECTION_NEVER_SHARED|sourceContent|review|rights/);
  assert.deepEqual(await findRelatedPublishedReadings(repo, item('draft', { publicationState: 'draft' })), []);
  assert.deepEqual((await findRelatedPublishedReadings(repo, current, { limit: 1 })).map(row => row.id), ['both']);
});

test('standalone query does not change active Library selection or list state', async () => {
  const repo = { async listPublished() { return { items: [item('second')] }; },
    async getPublishedById(id) { return item(id); } };
  const service = createLibraryService({ repository: repo });
  await service.getItem('first');
  const before = service.getState();
  assert.deepEqual((await service.findRelated(before.selectedItem)).map(row => row.id), ['second']);
  assert.equal(service.getState(), before);
  await assert.rejects(findRelatedPublishedReadings({ listPublished: async () => ({ items: Array(13).fill(item('bad')) }) }, item('first')), /Invalid related Library result/);
});

test('detail UI requires an explicit click, escapes titles and ignores late context responses', async () => {
  let render, context, done;
  const events = new Map(), node = { innerHTML: '', textContent: '' };
  const host = {
    innerHTML: '', textContent: '', setAttribute() {}, focus() {}, contains() { return true; },
    querySelector(selector) { return selector === '[data-library-related-results]' ? node : null; },
    addEventListener(type, fn) { events.set(type, fn); },
    removeEventListener(type) { events.delete(type); },
  };
  const back = { addEventListener() {}, removeEventListener() {} };
  const opened = [];
  const service = {
    subscribe(fn) { render = fn; return () => {}; }, getItem() {}, reset() {},
    findRelated() { return new Promise(resolve => { done = resolve; }); },
  };
  const dispose = createLibraryItemPage({ service, id: 'first', onBack() {},
    onRelated: destination => opened.push(destination),
    subscribeContext(fn) { context = fn; return () => {}; },
  }).mount({ querySelector: selector => selector === '[data-library-detail]' ? host : back });
  const click = (action, id) => {
    const button = { dataset: { libraryRelatedAction: action, id }, disabled: false };
    button.closest = () => button;
    events.get('click')({ target: button });
    return button;
  };
  render({ status: 'ready', selectedItem: item('first') });
  assert.match(host.innerHTML, /data-library-related-action="load"/);
  assert.doesNotMatch(host.innerHTML.match(/<section data-library-related[\\s\\S]*?<\\/section>/)?.[0] ?? '', /PRIVATE_REFLECTION_NEVER_SHARED/);
  click('load');
  await new Promise(resolve => setImmediate(resolve));
  done([{ id: 'second', title: '<script>safe title</script>' }]);
  await new Promise(resolve => setImmediate(resolve));
  assert.match(node.innerHTML, /&lt;script&gt;safe title&lt;\/script&gt;/);
  click('open', 'second');
  assert.deepEqual(opened, [{ routeKey: 'library-item', resourceId: 'second' }]);
  render({ status: 'ready', selectedItem: item('first') });
  click('load');
  await new Promise(resolve => setImmediate(resolve));
  context();
  done([{ id: 'late', title: 'Must stay hidden' }]);
  await new Promise(resolve => setImmediate(resolve));
  assert.doesNotMatch(node.innerHTML, /Must stay hidden/);
  click('open', 'late');
  assert.equal(opened.length, 1);
  dispose();
});

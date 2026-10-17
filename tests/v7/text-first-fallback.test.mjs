import test from 'node:test';
import assert from 'node:assert/strict';
import { createV7LibraryVisualContentCard } from '../../src/features/library/visual-content-card.js';

class Node {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.events = {};
    this.className = '';
    this.dataset = {};
    this.textContent = '';
  }
  append(...nodes) { this.children.push(...nodes); }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(key, fn) { this.events[key] = fn; }
}
const document = { createElement: tag => new Node(tag) };
const item = {
  id: 'devotional.test.01', contentType: 'devotional',
  title: 'Stay When You Feel Nothing', summary: 'A gentle daily reflection.',
  publicationState: 'published',
  rights: { status: 'verified', allowedUses: ['display'] },
};

test('missing artwork produces visible color/text content, preserves action and published-content safeguards', () => {
  let opened;
  const card = createV7LibraryVisualContentCard({
    document, item, registry: null, onOpen: selected => { opened = selected; },
  });
  assert.match(card.className, /bq-v7-content-card--text-only/);
  const [cover, details] = card.children;
  assert.match(cover.className, /bq-v7-content-card__cover--text-only/);
  assert.equal(cover.textContent, 'Devotional');
  assert.equal(cover.children.length, 0);
  assert.ok(details.children.some(node => node.tagName === 'h3' && node.textContent === item.title));
  const open = details.children.at(-1);
  assert.equal(open.attributes['aria-label'], 'Open: ' + item.title);
  open.events.click({ stopPropagation() {} });
  assert.deepEqual(opened, { id: item.id, contentType: 'devotional' });
  assert.throws(() => createV7LibraryVisualContentCard({
    document, item: { ...item, rights: { status: 'unverified', allowedUses: [] } },
    registry: null, onOpen() {},
  }), /rights-verified published/);
});

test('audited artwork remains optional, and a failed image becomes readable color/text', () => {
  const sha = 'a'.repeat(64), assetId = 'audited-devotional-01';
  const registry = { schemaVersion: 1, assets: [{
    assetId, contentType: 'devotional', contentId: item.id,
    src: '/v7/images/devotional/approved.webp', sha256: sha,
    alt: 'A reader at a table', fallbackKey: 'devotional',
  }], byContent: { ['devotional:' + item.id]: [assetId] } };
  const card = createV7LibraryVisualContentCard({ document, item, registry, onOpen() {} });
  const [cover] = card.children;
  assert.doesNotMatch(card.className, /text-only/);
  assert.equal(cover.children[0].tagName, 'img');
  assert.equal(cover.children[0].src, '/v7/images/devotional/approved.webp');
  cover.children[0].events.error();
  assert.match(card.className, /text-only/);
  assert.equal(cover.textContent, 'Devotional');
});

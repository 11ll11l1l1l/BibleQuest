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
  append(...nodes) { for (const node of nodes) { node.parentNode = this; this.children.push(node); } }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(node => node !== this); }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(key, fn) { this.events[key] = fn; }
}
const document = { createElement: tag => new Node(tag) };
const item = {
  id: 'devotional.test.01', contentType: 'devotional',
  title: 'Stay When You Feel Nothing', summary: 'A gentle daily reflection.',
  readingMinutes: 4, progressLabel: 'Started',
  taxonomyLinks: [{ kind: 'topic', id: 'topic.hope', labels: { en: 'Hope' } }],
  publicationState: 'published',
  rights: { status: 'verified', allowedUses: ['display'] },
};

test('missing artwork produces visible color/text content, preserves action and published-content safeguards', () => {
  let opened;
  const card = createV7LibraryVisualContentCard({
    document, item, registry: null, onOpen: selected => { opened = selected; },
  });
  assert.match(card.className, /bq-v7-content-card--text-only/);
  const [details] = card.children;
  assert.equal(card.children.length, 1, 'text-only cards do not reserve a decorative cover slot');
  assert.ok(details.children.some(node => node.className === 'bq-v7-content-card__eyebrow' && node.textContent === 'Devotional'));
  assert.ok(details.children.some(node => node.className === 'bq-v7-content-card__meta' && node.textContent === 'Hope · 4 min · Started'));
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
  assert.equal(card.children.length, 1, 'failed approved art is removed from layout and live text remains');
  assert.ok(card.children[0].children.some(node => node.tagName === 'h3' && node.textContent === item.title));
});

test('compact Library rows without approved artwork show the real title without source tags or summaries', () => {
  let opened;
  const card = createV7LibraryVisualContentCard({ document, item, compact: true, onOpen: row => { opened = row; } });
  assert.match(card.className, /--compact/);
  assert.deepEqual(card.children.map(node => node.tagName), ['h3', 'button']);
  assert.equal(card.children[0].textContent, item.title);
  assert.equal(card.children[1].attributes['aria-label'], 'Open: ' + item.title);
  card.children[1].events.click({ stopPropagation() {} });
  assert.equal(opened.id, item.id);
});

test('compact Library retains approved artwork as a small thumbnail with its real title', () => {
  const assetId = 'audited-devotional-01';
  const registry = { schemaVersion: 1, assets: [{
    assetId, contentType: 'devotional', contentId: item.id,
    src: '/v7/images/devotional/approved.webp', sha256: 'a'.repeat(64),
    alt: 'A reader at a table', fallbackKey: 'devotional',
  }], byContent: { ['devotional:' + item.id]: [assetId] } };
  const card = createV7LibraryVisualContentCard({ document, item, registry, compact: true, onOpen() {} });
  assert.deepEqual(card.children.map(node => node.tagName), ['img', 'h3', 'button']);
  assert.equal(card.children[0].src, '/v7/images/devotional/approved.webp');
  assert.equal(card.children[1].textContent, item.title);
  card.children[0].events.error();
  assert.deepEqual(card.children.map(node => node.tagName), ['h3', 'button']);
  assert.throws(() => createV7LibraryVisualContentCard({ document, item: { ...item, rights: { status: 'unverified', allowedUses: [] } }, registry, compact: true, onOpen() {} }), /rights-verified published/);
});

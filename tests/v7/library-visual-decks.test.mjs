import assert from 'node:assert/strict';
import test from 'node:test';
import { LIBRARY_EMOTIONS, LIBRARY_NEEDS } from '../../src/features/library/emotion-taxonomy.js';
import {
  V7_EMOTION_VISUAL_IDS, assertV7PublishedVisualCardItem, buildV7LibraryDeckModel,
  normalizeV7DeckLocale, resolveV7LibraryVisual, safeV7VisualPath
} from '../../src/features/library/visual-registry.js';

const SHA = 'a'.repeat(64);
function assetsManifest({ src = '/v7/images/emotion/anxiety.webp', thumb = '/v7/images/emotion/anxiety-thumbnail.webp' } = {}) {
  const asset = {
    assetId: 'bqv7-emotion-anxiety-worry-01',
    contentType: 'emotion', contentId: 'anxiety_worry', src,
    sha256: SHA, alt: 'A person thinking quietly by a window',
    fallbackKey: 'emotion',
    variants: [{ kind: 'with_text', locale: 'en', src: '/v7/images/emotion/anxiety-with-text-en.webp', sha256: SHA },
      { kind: 'thumbnail', src: thumb, sha256: SHA }]
  };
  return { schemaVersion: 1, assets: [asset], byContent: { 'emotion:anxiety_worry': [asset.assetId] } };
}

test('the independent Feeling and Need decks preserve their real taxonomies and localized titles', () => {
  const emotions = buildV7LibraryDeckModel({ kind: 'emotion', locale: 'fil', selectedIds: ['anxious'] });
  const needs = buildV7LibraryDeckModel({ kind: 'need', locale: 'ceb', selectedIds: ['peace'] });
  assert.equal(emotions.entries.length, LIBRARY_EMOTIONS.length);
  assert.equal(emotions.entries.length, 30);
  assert.equal(needs.entries.length, LIBRARY_NEEDS.length);
  assert.equal(needs.entries.length, 19);
  assert.equal(normalizeV7DeckLocale('fil'), 'tl');
  assert.equal(emotions.locale, 'tl');
  assert.equal(emotions.entries.find(row => row.id === 'anxious').selected, true);
  assert.equal(needs.entries.find(row => row.id === 'peace').selected, true);
  assert.equal(needs.entries.every(row => row.kind === 'need'), true);
  assert.notEqual(emotions.question, needs.question);
});

test('all 30 discovery emotions have explicit matching visual production concepts', () => {
  assert.deepEqual(Object.keys(V7_EMOTION_VISUAL_IDS).sort(), LIBRARY_EMOTIONS.map(row => row.id).sort());
  assert.equal(new Set(Object.values(V7_EMOTION_VISUAL_IDS)).size, 30);
});

test('audited CLEAN master is used even when TYPE lettering exists but is not separately approved', () => {
  const registry = assetsManifest();
  const visual = resolveV7LibraryVisual(registry, 'emotion', 'anxious');
  assert.equal(visual.type, 'clean');
  assert.equal(visual.src, '/v7/images/emotion/anxiety.webp');
  assert.equal(visual.alt, 'A person thinking quietly by a window');
  assert.equal(resolveV7LibraryVisual(registry, 'emotion', 'anxious', { thumbnail: true }).type, 'thumbnail');
  assert.equal(resolveV7LibraryVisual(registry, 'emotion', 'anxious', { thumbnail: true }).src,
    '/v7/images/emotion/anxiety-thumbnail.webp');
});

test('unsafe, missing and mismatched image records always fall back to readable live text', () => {
  assert.equal(safeV7VisualPath('https://malicious.example/file.webp'), '');
  assert.equal(safeV7VisualPath('/v7/images/../secrets.webp'), '');
  assert.equal(safeV7VisualPath('javascript:alert(1)'), '');
  assert.equal(resolveV7LibraryVisual(assetsManifest({ src: 'https://elsewhere.test/art.webp' }), 'emotion', 'anxious').src, '');
  assert.equal(resolveV7LibraryVisual(assetsManifest(), 'need', 'peace').src, '');
  const registry = assetsManifest();
  registry.assets[0].contentId = 'fear';
  assert.equal(resolveV7LibraryVisual(registry, 'emotion', 'anxious').src, '');
  assert.throws(() => buildV7LibraryDeckModel({ kind: 'topic' }), /deck kind/);
});

test('unsafe derivative images cannot replace a safe CLEAN master', () => {
  const manifest = assetsManifest({ thumb: 'https://outside.example/thumbnail.webp' });
  const visual = resolveV7LibraryVisual(manifest, 'emotion', 'anxious', { thumbnail: true });
  assert.equal(visual.type, 'clean');
  assert.equal(visual.src, '/v7/images/emotion/anxiety.webp');
});

test('asset-free locale decks provide deterministic visual fallbacks without borrowing art', () => {
  const entries = buildV7LibraryDeckModel({ kind: 'need', locale: 'ilo', registry: null }).entries;
  assert.equal(entries.every(row => row.visual.type === 'fallback' && row.visual.src === ''), true);
  assert.ok(entries[0].label);
});

test('cover-led cards cannot expose unapproved or rights-unknown Library content', () => {
  const item = {
    id: 'book-1', title: 'Approved Book', contentType: 'book',
    publicationState: 'published', rights: { status: 'verified', allowedUses: ['external_link'] },
  };
  assert.equal(assertV7PublishedVisualCardItem(item), item);
  assert.throws(() => assertV7PublishedVisualCardItem({ ...item, publicationState: 'pending_review' }), /rights-verified published/);
  assert.throws(() => assertV7PublishedVisualCardItem({ ...item, rights: { status: 'unknown', allowedUses: ['display'] } }), /rights-verified published/);
  assert.throws(() => assertV7PublishedVisualCardItem({ ...item, rights: { status: 'verified', allowedUses: [] } }), /rights-verified published/);
});


test('only matching BibleQuest devotional emotion themes reuse audited CLEAN artwork', () => {
  const manifest = assetsManifest();
  const shared = resolveV7LibraryVisual(manifest, 'devotional', 'devotional.biblequest.anxiety_worry.01');
  assert.equal(shared.assetId, 'bqv7-emotion-anxiety-worry-01');
  assert.equal(shared.src, '/v7/images/emotion/anxiety.webp');
  assert.equal(shared.type, 'shared_emotion_theme');
  assert.equal(resolveV7LibraryVisual(manifest, 'devotional', 'devotional.biblequest.sadness.01').src, '');
  assert.equal(resolveV7LibraryVisual(manifest, 'devotional', 'devotional.other.anxiety_worry.01').src, '');
  assert.equal(resolveV7LibraryVisual(manifest, 'devotional', 'devotional.biblequest.anxiety_worry.01-extra').src, '');
});

test('an explicitly approved devotional cover takes precedence over shared thematic art', () => {
  const registry = assetsManifest();
  const own = {
    assetId: 'bqv7-devotional-anxiety-worry-01', contentType: 'devotional',
    contentId: 'devotional.biblequest.anxiety_worry.01',
    src: '/v7/images/devotional/approved-cover.webp', sha256: SHA,
    alt: 'Approved original cover',
  };
  registry.assets.push(own);
  registry.byContent['devotional:devotional.biblequest.anxiety_worry.01'] = [own.assetId];
  const visual = resolveV7LibraryVisual(registry, 'devotional', own.contentId);
  assert.equal(visual.src, own.src);
  assert.equal(visual.type, 'clean');
});

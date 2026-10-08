import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeV7VisualRegistry, findV7Visual } from '../../src/features/library/visual-assets.js';
import { renderLibraryEmotionDiscovery } from '../../src/features/library/emotion-discovery-panel.js';

const sha = 'a'.repeat(64);
const fixture = () => ({
  schemaVersion: 1,
  assets: [{
    assetId: 'bqv7-emotion-anxiety-worry-01',
    contentType: 'emotion', contentId: 'anxiety_worry',
    src: '/v7/images/emotion/bqv7-emotion-anxiety-worry-01.webp',
    sha256: sha, alt: 'A thoughtful person resting by the window.',
    focalPoint: { x: 0.5, y: 0.4 },
    variants: [{ kind: 'with_text',
      src: '/v7/images/emotion/bqv7-emotion-anxiety-worry-01-with-text-en.webp',
      sha256: sha, locale: 'en', embeddedText: 'Anxious / worried' }]
  }],
  byContent: { 'emotion:anxiety_worry': ['bqv7-emotion-anxiety-worry-01'] }
});

test('audited art is resolved through a persisted content ID, not staged sidecars', () => {
  const registry = normalizeV7VisualRegistry(fixture());
  assert.equal(findV7Visual(registry, ['emotion:anxiety_worry'], 'en', 'Anxious / worried').src.endsWith('-with-text-en.webp'), true);
  assert.equal(findV7Visual(registry, ['emotion:anxiety_worry'], 'tl', 'Balisa / nag-aalala').src.endsWith('-01.webp'), true);
  assert.equal(findV7Visual(registry, ['emotion:unknown']), null);
});

test('Feeling tiles show approved photos with live text while missing art stays readable', () => {
  const registry = normalizeV7VisualRegistry(fixture());
  const html = renderLibraryEmotionDiscovery({ emotions: ['anxious'] }, 'en', registry);
  assert.match(html, /bqv7-emotion-anxiety-worry-01-with-text-en\.webp/);
  assert.match(html, /Anxious \/ worried/);
  assert.match(html, /data-library-discovery-id="afraid" aria-pressed="false"/);
  assert.match(html, /has-visual-fallback/);
  assert.match(html, /loading="lazy"/);
});

test('tampered paths, hashes and unknown content IDs cannot enter the runtime index', () => {
  for (const patch of [
    { src: 'https://example.org/unverified.webp' },
    { src: '/v7/images/emotion/../../secret.webp' },
    { sha256: 'not-a-sha' },
    { alt: '' },
  ]) {
    const data = fixture();
    Object.assign(data.assets[0], patch);
    assert.throws(() => normalizeV7VisualRegistry(data), /Invalid/);
  }
  const data = fixture();
  data.byContent['emotion:afraid'] = ['unregistered'];
  assert.throws(() => normalizeV7VisualRegistry(data), /unknown asset/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { libraryTaxonomyLabel, normalizeLibraryTaxonomy } from '../../src/features/library/discovery.js';

test('taxonomy uses canonical reviewed metadata and identifies the actual fallback language', () => {
  const [term] = normalizeLibraryTaxonomy([{ id: 'topic.hope', kind: 'topic', labels: { 'EN-us': 'Hope', ja: '希望' } }]);
  assert.equal(term.labels['en-US'], 'Hope');
  assert.deepEqual(libraryTaxonomyLabel(term, 'ja'), { label: '希望', locale: 'ja', fallback: false });
  assert.deepEqual(libraryTaxonomyLabel(term, 'ilo'), { label: 'Hope', locale: 'en-US', fallback: true });
  assert.equal(Object.isFrozen(term.labels), true);
});

test('English label is the defined fallback regardless of import key order', () => {
  const [term] = normalizeLibraryTaxonomy([{ id: 'topic.prayer', kind: 'topic', labels: { ja: '祈り', en: 'Prayer' } }]);
  assert.deepEqual(libraryTaxonomyLabel(term, 'tl'), { label: 'Prayer', locale: 'en', fallback: true });
  assert.throws(() => normalizeLibraryTaxonomy([{ id: 'topic.prayer', kind: 'topic', labels: { en: 'Prayer', EN: 'Different' } }]),
    error => error.code === 'duplicate_taxonomy_locale');
});

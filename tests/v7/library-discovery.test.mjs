import test from 'node:test';
import assert from 'node:assert/strict';
import {
  libraryTaxonomyLabel,
  normalizeLibraryTaxonomy,
  resolveLibraryDiscoveryTerms,
} from '../../src/features/library/discovery.js';

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

test('emotion and need discovery resolves only available canonical topic aliases', () => {
  const options = resolveLibraryDiscoveryTerms([
    { id: 'topic.worry', kind: 'topic', labels: { en: 'Worry' } },
    { id: 'hope', kind: 'topic', labels: { en: 'Hope' } },
    { id: 'topic.daily-faith', kind: 'topic', labels: { en: 'Daily faith' } },
    { id: 'topic.discipleship', kind: 'topic', labels: { en: 'Discipleship' } },
    { id: 'category.books', kind: 'category', labels: { en: 'Books' } },
    { id: 'topic.unmapped', kind: 'topic', labels: { en: 'Unmapped' } },
  ]);

  assert.deepEqual(options.map(option => [option.id, option.intent]), [
    ['topic.worry', 'emotion'],
    ['hope', 'emotion'],
    ['topic.daily-faith', 'need'],
    ['topic.discipleship', 'need'],
  ]);
  assert.equal(Object.isFrozen(options), true);
  assert.equal(Object.isFrozen(options[0]), true);
});

test('discovery aliases do not invent filters when canonical taxonomy does not contain them', () => {
  assert.deepEqual(resolveLibraryDiscoveryTerms([
    { id: 'fixture.topic', kind: 'topic', labels: { en: 'Fixture Topic' } },
    { id: 'fixture.sample', kind: 'tag', labels: { en: 'Fixture Only' } },
  ]), []);
});

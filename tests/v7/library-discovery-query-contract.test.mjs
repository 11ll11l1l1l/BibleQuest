import test from 'node:test';
import assert from 'node:assert/strict';
import { createV7TaxonomyIndex } from '../../src/v7/content/contract.js';
import {
  LIBRARY_DISCOVERY_QUERY_SEMANTICS,
  createLibraryDiscoveryTaxonomyLinks,
  normalizeLibraryDiscoveryRequest,
  summarizeLibraryDiscoveryCoverage,
  toLibraryDiscoveryTaxonomyFilters,
} from '../../src/features/library/discovery-query-contract.js';

test('A3 normalizes aliases before persistence and exposes exact query semantics', () => {
  const request = normalizeLibraryDiscoveryRequest({
    emotions: ['worried', 'afraid', 'worried'],
    needs: ['peace'],
    topics: ['prayer', 'daily_faith'],
    lifeSituations: ['work_stress'],
    locale: 'ilo-PH',
  });
  assert.deepEqual(request, {
    emotions: ['afraid', 'anxious'],
    needs: ['peace'],
    topics: ['daily_faith', 'prayer'],
    lifeSituations: ['work_stress'],
    locale: 'ilo',
  });
  assert.deepEqual(LIBRARY_DISCOVERY_QUERY_SEMANTICS, {
    withinDimension: 'or',
    acrossDimensions: 'and',
    pagination: 'updated_at_desc_then_id_asc',
  });
  assert.deepEqual(toLibraryDiscoveryTaxonomyFilters(request), {
    emotions: ['emotion.fear', 'emotion.anxiety_worry'],
    needs: ['need.peace'],
    topics: ['topic.daily_faith', 'topic.prayer'],
    lifeSituations: ['life_situation.work_stress'],
  });
});

test('manifest adapter emits canonical taxonomy rows only and never alias rows', () => {
  const links = createLibraryDiscoveryTaxonomyLinks({
    emotions: ['worried', 'anxious'],
    needs: ['peace'],
    topics: ['prayer'],
    lifeSituations: ['work_stress'],
  });
  assert.deepEqual(links, [
    { id: 'emotion.anxious', kind: 'emotion', order: 0 },
    { id: 'need.peace', kind: 'need', order: 0 },
    { id: 'topic.prayer', kind: 'topic', order: 0 },
    { id: 'life_situation.work_stress', kind: 'life_situation', order: 0 },
  ]);
  assert.equal(links.some(link => link.id.includes('worried')), false);
});

test('content contract accepts explicit discovery kinds and rejects non-namespaced persisted discovery IDs', () => {
  const index = createV7TaxonomyIndex([
    { id: 'emotion.anxious', kind: 'emotion', labels: { en: 'Anxious' } },
    { id: 'need.peace', kind: 'need', labels: { en: 'Peace' } },
    { id: 'topic.prayer', kind: 'topic', labels: { en: 'Prayer' } },
    { id: 'life_situation.work_stress', kind: 'life_situation', labels: { en: 'Work stress' } },
  ]);
  assert.deepEqual([...index.values()].map(entry => entry.kind), ['emotion', 'need', 'topic', 'life_situation']);
  assert.throws(() => createV7TaxonomyIndex([
    { id: 'anxious', kind: 'emotion', labels: { en: 'Anxious' } },
  ]), error => error.code === 'taxonomy_id');
});

test('coverage helper reports count, distinct works, and distinct authors without double counting links', () => {
  const coverage = summarizeLibraryDiscoveryCoverage([
    {
      id: 'd1',
      source: { catalogId: 'work-1', creator: 'Author A' },
      taxonomyLinks: [
        { id: 'emotion.anxious', kind: 'emotion' },
        { id: 'emotion.anxious', kind: 'emotion' },
        { id: 'need.peace', kind: 'need' },
      ],
    },
    {
      id: 'd2',
      source: { catalogId: 'work-1', creator: 'Author B' },
      taxonomyLinks: [{ id: 'emotion.anxious', kind: 'emotion' }],
    },
    {
      id: 'd3',
      source: { catalogId: 'work-2', creator: 'Author A' },
      taxonomyLinks: [{ id: 'need.peace', kind: 'need' }],
    },
  ]);

  assert.deepEqual(coverage.emotions.anxious, { count: 2, distinctWorks: 1, distinctAuthors: 2 });
  assert.deepEqual(coverage.needs.peace, { count: 2, distinctWorks: 2, distinctAuthors: 1 });
  assert.deepEqual(coverage.emotions.afraid, { count: 0, distinctWorks: 0, distinctAuthors: 0 });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterLibraryDiscoveryItems,
  renderLibraryDiscoveryEmptyState,
  renderLibraryEmotionDiscovery,
} from '../../src/features/library/emotion-discovery-panel.js';

test('full discovery panel renders all launch emotions and needs as selectable controls', () => {
  const html = renderLibraryEmotionDiscovery({ emotions: ['worried', 'heartbroken'], needs: ['peace'] }, 'en');
  assert.match(html, /How are you feeling\?/);
  assert.match(html, /What do you need right now\?/);
  assert.equal((html.match(/data-library-discovery-kind="emotion"/g) || []).length, 30);
  assert.equal((html.match(/data-library-discovery-kind="need"/g) || []).length, 19);
  assert.match(html, /data-library-discovery-id="anxious" aria-pressed="true"/);
  assert.match(html, /data-library-discovery-id="grieving" aria-pressed="true"/);
  assert.match(html, /data-library-discovery-id="peace" aria-pressed="true"/);
  assert.match(html, /data-library-discovery-id="hopeful" aria-pressed="false"/);
});

test('Ilocano shell and taxonomy labels render without translating devotional content', () => {
  const html = renderLibraryEmotionDiscovery({}, 'ilo');
  assert.match(html, /Ania ti mariknam\?/);
  assert.match(html, /Ania ti kasapulam ita\?/);
  assert.match(html, /Madanagan \/ mariribukan/);
  assert.match(html, /Panagtalek/);
});

test('fixture filter requires all selected dimensions and accepts direct or taxonomy-backed tags', () => {
  const items = [
    { id: 'a', discovery: { emotions: ['anxious', 'overwhelmed'], needs: ['peace'], topics: ['prayer'], lifeSituations: ['work_stress'] } },
    { id: 'b', discovery: { emotions: ['anxious'], needs: ['peace'], topics: ['prayer'], lifeSituations: ['work_stress'] } },
    { id: 'c', taxonomyLinks: [
      { id: 'emotion.anxious' }, { id: 'emotion.overwhelmed' }, { id: 'need.peace' },
      { id: 'topic.prayer' }, { id: 'life.work_stress' },
    ] },
  ];
  const filtered = filterLibraryDiscoveryItems(items, {
    emotions: ['worried', 'burned out'], needs: ['peace'], topics: ['prayer'], lifeSituations: ['work_stress'],
  });
  assert.deepEqual(filtered.map(item => item.id), ['a', 'c']);
  assert.equal(Object.isFrozen(filtered), true);
});

test('zero-result rendering recommends adjacent taxonomy and Scripture without inventing a devotional', () => {
  const html = renderLibraryDiscoveryEmptyState({ emotions: ['heartbroken'], needs: ['comfort'] }, 'en');
  assert.match(html, /No published devotionals match all of these selections yet\./);
  assert.match(html, /You could also try/);
  assert.match(html, /BSB Scripture to read/);
  assert.match(html, /Psalm 147:3/);
  assert.doesNotMatch(html, /data-library-item=/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LIBRARY_DISCOVERY_LOCALES,
  LIBRARY_EMOTIONS,
  LIBRARY_NEEDS,
  canonicalizeLibraryDiscoveryTerm,
  getLibraryDiscoveryEmptyState,
  libraryDiscoveryLabel,
  libraryDiscoveryShellLabel,
  normalizeLibraryDiscoveryQuery,
  parseLibraryDiscoveryQuery,
  serializeLibraryDiscoveryQuery,
  toLibraryDiscoveryRequest,
  toggleLibraryDiscoverySelection,
} from '../../src/features/library/emotion-taxonomy.js';

test('launch taxonomy contains every accepted emotion and need with four-locale labels', () => {
  assert.equal(LIBRARY_EMOTIONS.length, 30);
  assert.equal(LIBRARY_NEEDS.length, 19);
  assert.deepEqual(LIBRARY_DISCOVERY_LOCALES, ['en', 'tl', 'ceb', 'ilo']);

  for (const item of [...LIBRARY_EMOTIONS, ...LIBRARY_NEEDS]) {
    assert.match(item.id, /^[a-z0-9]+(?:_[a-z0-9]+)*$/);
    assert.ok(item.scripture.length >= 1, `${item.kind}:${item.id} needs a truthful Scripture handoff`);
    for (const locale of LIBRARY_DISCOVERY_LOCALES) {
      assert.ok(item.labels[locale]?.trim(), `${item.kind}:${item.id} missing ${locale}`);
      assert.ok(libraryDiscoveryLabel(item, locale).label.trim());
    }
  }

  for (const key of ['feelingQuestion', 'needQuestion', 'selected', 'suggestions', 'scripture', 'noResults']) {
    for (const locale of LIBRARY_DISCOVERY_LOCALES) assert.ok(libraryDiscoveryShellLabel(key, locale).trim());
  }
});

test('accepted synonym examples canonicalize deterministically without conflating emotion and need', () => {
  assert.equal(canonicalizeLibraryDiscoveryTerm('worried', 'emotion'), 'anxious');
  assert.equal(canonicalizeLibraryDiscoveryTerm('burned out', 'emotion'), 'overwhelmed');
  assert.equal(canonicalizeLibraryDiscoveryTerm('lost', 'emotion'), 'confused');
  assert.equal(canonicalizeLibraryDiscoveryTerm('heartbroken', 'emotion'), 'grieving');
  assert.equal(canonicalizeLibraryDiscoveryTerm('hopeful', 'emotion'), 'hopeful');
  assert.equal(canonicalizeLibraryDiscoveryTerm('hope', 'need'), 'hope');
  assert.equal(canonicalizeLibraryDiscoveryTerm('peaceful', 'emotion'), 'peaceful');
  assert.equal(canonicalizeLibraryDiscoveryTerm('peace', 'need'), 'peace');
  assert.equal(canonicalizeLibraryDiscoveryTerm('hope', 'emotion'), null);
  assert.equal(canonicalizeLibraryDiscoveryTerm('unknown feeling', 'emotion'), null);
});

test('multi-select query normalization is stable, deduplicated, and alias-aware', () => {
  const query = normalizeLibraryDiscoveryQuery({
    emotions: ['worried', 'anxious', 'heartbroken', 'burned out'],
    needs: ['peace', 'hope', 'peace'],
    topics: ['prayer', 'daily_faith', 'bad topic'],
    lifeSituations: ['work_stress', 'new_parent', 'invalid situation'],
  });
  assert.deepEqual(query, {
    emotions: ['anxious', 'grieving', 'overwhelmed'],
    needs: ['hope', 'peace'],
    topics: ['daily_faith', 'prayer'],
    lifeSituations: ['new_parent', 'work_stress'],
  });
  assert.equal(Object.isFrozen(query), true);
  for (const value of Object.values(query)) assert.equal(Object.isFrozen(value), true);
});

test('selection toggles independently and repeated URL parameters round-trip predictably', () => {
  let query = normalizeLibraryDiscoveryQuery();
  query = toggleLibraryDiscoverySelection(query, 'emotion', 'worried');
  query = toggleLibraryDiscoverySelection(query, 'emotion', 'heartbroken');
  query = toggleLibraryDiscoverySelection(query, 'need', 'peace');
  assert.deepEqual(query.emotions, ['anxious', 'grieving']);
  assert.deepEqual(query.needs, ['peace']);

  const params = serializeLibraryDiscoveryQuery({ ...query, topics: ['prayer'], lifeSituations: ['work_stress'] });
  assert.deepEqual(params.getAll('emotion'), ['anxious', 'grieving']);
  assert.deepEqual(params.getAll('need'), ['peace']);
  assert.deepEqual(params.getAll('topic'), ['prayer']);
  assert.deepEqual(params.getAll('lifeSituation'), ['work_stress']);
  assert.deepEqual(parseLibraryDiscoveryQuery(params), {
    emotions: ['anxious', 'grieving'],
    needs: ['peace'],
    topics: ['prayer'],
    lifeSituations: ['work_stress'],
  });

  query = toggleLibraryDiscoverySelection(query, 'emotion', 'anxious');
  assert.deepEqual(query.emotions, ['grieving']);
  assert.deepEqual(query.needs, ['peace']);
});

test('A3 handoff shape is exact and locale normalization is deterministic', () => {
  assert.deepEqual(toLibraryDiscoveryRequest({ emotions: ['worried'], needs: ['guidance'] }, 'ilo-PH'), {
    emotions: ['anxious'],
    needs: ['guidance'],
    topics: [],
    lifeSituations: [],
    locale: 'ilo',
  });
  assert.equal(toLibraryDiscoveryRequest({}, 'unsupported').locale, 'en');
});

test('zero-result helper stays truthful and returns only adjacent taxonomy plus BSB references', () => {
  const empty = getLibraryDiscoveryEmptyState({ emotions: ['worried'], needs: ['peace'] }, 'tl');
  assert.match(empty.message, /Wala pang na-publish/);
  assert.ok(empty.suggestions.length > 0 && empty.suggestions.length <= 3);
  assert.ok(empty.scriptures.length > 0 && empty.scriptures.length <= 3);
  assert.ok(empty.scriptures.every(reference => typeof reference === 'string' && /\d/.test(reference)));
  assert.ok(empty.suggestions.every(item => item.id !== 'anxious' && item.id !== 'peace'));
});

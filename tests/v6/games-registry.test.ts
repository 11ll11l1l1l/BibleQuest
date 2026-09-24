import assert from 'node:assert/strict';
import test from 'node:test';
import type { GameMetadata } from '../../src/v6/games/contracts.ts';
import { legacyGameRegistry } from '../../src/v6/games/legacy-registry.ts';
import { createGameRegistry } from '../../src/v6/games/registry.ts';

test('V6 Games registry provides stable metadata for every current game family', () => {
  const ids = legacyGameRegistry.list().map((game) => game.id);
  assert.deepEqual(ids, [
    'quick-recall',
    'context-challenge',
    'mixed-quest',
    'per-book-recall',
    'character-detective',
    'timeline-challenge',
    'kids-memory-match',
    'same-room',
  ]);

  assert.equal(legacyGameRegistry.require('quick-recall').family, 'multiple-choice');
  assert.equal(legacyGameRegistry.require('per-book-recall').lazyContent, true);
  assert.equal(legacyGameRegistry.require('kids-memory-match').rewardAuthority, 'profile-rewards');
  assert.deepEqual(legacyGameRegistry.require('same-room').capabilities, {
    solo: false,
    passAndPlay: true,
    remote: false,
  });
});

test('V6 Games registry rejects duplicate ids and malformed metadata', () => {
  const row: GameMetadata = {
    id: 'demo-game',
    title: 'Demo',
    kicker: 'DEMO',
    description: 'A deterministic test game.',
    family: 'multiple-choice',
    capabilities: { solo: true, passAndPlay: false, remote: false },
    rewardAuthority: 'none',
    lazyContent: false,
  };

  assert.throws(() => createGameRegistry([row, row]), /Duplicate game id/);
  assert.throws(
    () => createGameRegistry([{ ...row, id: 'Bad ID' }]),
    /Invalid game id/,
  );
  assert.equal(createGameRegistry([row]).get('missing'), null);
  assert.throws(() => createGameRegistry([row]).require('missing'), /Unknown BibleQuest game/);
});

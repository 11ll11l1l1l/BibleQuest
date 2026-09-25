import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LEGACY_GAME_CHARACTERIZATION,
  characterizeLegacyGame,
} from '../../src/v6/games/characterization.ts';
import { legacyGameRegistry } from '../../src/v6/games/legacy-registry.ts';

test('Games characterization inventory covers every current launcher/embedded game exactly once', () => {
  const inventoryIds = LEGACY_GAME_CHARACTERIZATION.map((game) => game.id);
  const registryIds = legacyGameRegistry.list().map((game) => game.id);
  assert.deepEqual(inventoryIds, registryIds);
  assert.equal(new Set(inventoryIds).size, inventoryIds.length);
  assert.equal(LEGACY_GAME_CHARACTERIZATION.every((game) => game.launcherToResult.length >= 2), true);
});

test('Games characterization records current persistence, timer and lazy-content behavior', () => {
  assert.equal(characterizeLegacyGame('quick-recall')?.persistence, 'local-resume');
  assert.equal(characterizeLegacyGame('per-book-recall')?.lazyContent, true);
  assert.equal(characterizeLegacyGame('same-room')?.rewardAuthority, 'local-only');
  assert.equal(LEGACY_GAME_CHARACTERIZATION.some((game) => game.countdownTimer), false);
  assert.equal(characterizeLegacyGame('missing'), null);
});

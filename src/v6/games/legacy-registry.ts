import { GAME_MODES } from '../../features/games/content.js';
import { DETECTIVE_MODE } from '../../features/games/detectives.js';
import { KIDS_MEMORY_MODE } from '../../features/games/memory.js';
import { TIMELINE_MODE } from '../../features/games/timelines.js';
import type { GameFamily, GameMetadata } from './contracts.ts';
import { createGameRegistry } from './registry.ts';

const familyById: Readonly<Record<string, GameFamily>> = Object.freeze({
  'quick-recall': 'multiple-choice',
  'context-challenge': 'multiple-choice',
  'mixed-quest': 'multiple-choice',
  'per-book-recall': 'recall',
  'character-detective': 'detective',
  'timeline-challenge': 'timeline',
  'kids-memory-match': 'memory',
  'same-room': 'pass-and-play',
});

function metadata(
  source: { id: string; title: string; kicker: string; description: string },
  overrides: Partial<GameMetadata> = {},
): GameMetadata {
  const family = familyById[source.id];
  if (!family) throw new Error(`V6 Games registry has no family mapping for ${source.id}.`);
  return {
    id: source.id,
    title: source.title,
    kicker: source.kicker,
    description: source.description,
    family,
    capabilities: overrides.capabilities ?? { solo: true, passAndPlay: false, remote: false },
    rewardAuthority: overrides.rewardAuthority ?? 'profile-xp',
    lazyContent: overrides.lazyContent ?? false,
  };
}

const sameRoom = Object.freeze({
  id: 'same-room',
  title: 'Play Together',
  kicker: 'PASS-AND-PLAY',
  description: 'Share one device, rotate turns, and keep a local scoreboard.',
});

export const LEGACY_GAME_METADATA: readonly GameMetadata[] = Object.freeze([
  ...GAME_MODES.map((mode) =>
    metadata(mode, {
      lazyContent: mode.id === 'per-book-recall',
    }),
  ),
  metadata(DETECTIVE_MODE),
  metadata(TIMELINE_MODE),
  metadata(KIDS_MEMORY_MODE, {
    rewardAuthority: 'profile-rewards',
  }),
  metadata(sameRoom, {
    capabilities: { solo: false, passAndPlay: true, remote: false },
    rewardAuthority: 'local-only',
  }),
]);

export const legacyGameRegistry = createGameRegistry(LEGACY_GAME_METADATA);

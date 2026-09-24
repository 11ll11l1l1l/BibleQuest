import type { GameFamily, GameRewardAuthority } from './contracts.ts';

export interface LegacyGameCharacterization {
  readonly id: string;
  readonly family: GameFamily;
  readonly legacyOwner: string;
  readonly launcherToResult: readonly string[];
  readonly persistence: 'none' | 'local-result' | 'local-resume' | 'local-review' | 'profile-reward';
  readonly rewardAuthority: GameRewardAuthority;
  readonly countdownTimer: false;
  readonly lazyContent: boolean;
}

export const LEGACY_GAME_CHARACTERIZATION: readonly LegacyGameCharacterization[] = Object.freeze([
  Object.freeze({
    id: 'quick-recall',
    family: 'multiple-choice',
    legacyOwner: 'src/app/games.js',
    launcherToResult: Object.freeze(['launcher', 'question', 'complete']),
    persistence: 'local-resume',
    rewardAuthority: 'profile-xp',
    countdownTimer: false,
    lazyContent: false,
  }),
  Object.freeze({
    id: 'context-challenge',
    family: 'multiple-choice',
    legacyOwner: 'src/app/games.js',
    launcherToResult: Object.freeze(['launcher', 'question', 'complete']),
    persistence: 'local-resume',
    rewardAuthority: 'profile-xp',
    countdownTimer: false,
    lazyContent: false,
  }),
  Object.freeze({
    id: 'mixed-quest',
    family: 'multiple-choice',
    legacyOwner: 'src/app/games.js',
    launcherToResult: Object.freeze(['launcher', 'question', 'complete']),
    persistence: 'local-resume',
    rewardAuthority: 'profile-xp',
    countdownTimer: false,
    lazyContent: false,
  }),
  Object.freeze({
    id: 'per-book-recall',
    family: 'recall',
    legacyOwner: 'src/app/games.js + src/core/recall-packs.js',
    launcherToResult: Object.freeze(['launcher', 'recall-library', 'recall-question', 'recall-complete']),
    persistence: 'local-review',
    rewardAuthority: 'profile-xp',
    countdownTimer: false,
    lazyContent: true,
  }),
  Object.freeze({
    id: 'character-detective',
    family: 'detective',
    legacyOwner: 'src/app/games.js',
    launcherToResult: Object.freeze(['launcher', 'detective']),
    persistence: 'local-result',
    rewardAuthority: 'profile-xp',
    countdownTimer: false,
    lazyContent: false,
  }),
  Object.freeze({
    id: 'timeline-challenge',
    family: 'timeline',
    legacyOwner: 'src/app/games.js',
    launcherToResult: Object.freeze(['launcher', 'timeline']),
    persistence: 'local-result',
    rewardAuthority: 'profile-xp',
    countdownTimer: false,
    lazyContent: false,
  }),
  Object.freeze({
    id: 'kids-memory-match',
    family: 'memory',
    legacyOwner: 'src/app/kids-memory.js',
    launcherToResult: Object.freeze(['launcher', 'memory', 'memory-complete']),
    persistence: 'profile-reward',
    rewardAuthority: 'profile-rewards',
    countdownTimer: false,
    lazyContent: false,
  }),
  Object.freeze({
    id: 'same-room',
    family: 'pass-and-play',
    legacyOwner: 'src/app/games.js',
    launcherToResult: Object.freeze(['launcher', 'same-room-setup', 'same-room-question', 'same-room-complete']),
    persistence: 'none',
    rewardAuthority: 'local-only',
    countdownTimer: false,
    lazyContent: false,
  }),
]);

export function characterizeLegacyGame(id: string): LegacyGameCharacterization | null {
  return LEGACY_GAME_CHARACTERIZATION.find((game) => game.id === String(id ?? '').trim()) ?? null;
}

import type { MultipleChoiceSessionState } from './contracts.ts';
import { legacyRoundQuestions, type LegacyMultipleChoiceMode } from './legacy-question-adapter.ts';
import { startMultipleChoiceSession } from './session.ts';
import { startTurnRotation, type TurnState } from './turns.ts';

export interface LegacySoloAdapterSession {
  readonly kind: 'solo';
  readonly mode: LegacyMultipleChoiceMode;
  readonly session: MultipleChoiceSessionState;
}

export interface LegacyPassAndPlayAdapterSession {
  readonly kind: 'pass-and-play';
  readonly mode: 'mixed-quest';
  readonly session: MultipleChoiceSessionState;
  readonly turns: TurnState;
}

export function startLegacySoloSession(
  mode: LegacyMultipleChoiceMode,
  sessionId: string,
): LegacySoloAdapterSession {
  return Object.freeze({
    kind: 'solo',
    mode,
    session: startMultipleChoiceSession({
      gameId: mode,
      sessionId,
      questions: legacyRoundQuestions(mode),
    }),
  });
}

export function startLegacyPassAndPlaySession(
  sessionId: string,
  playerCount: number,
): LegacyPassAndPlayAdapterSession {
  if (!Number.isInteger(playerCount) || playerCount < 2 || playerCount > 6) {
    throw new Error('Play Together requires 2 to 6 players.');
  }
  const players = Array.from({ length: playerCount }, (_, index) => ({
    id: `player-${index + 1}`,
    name: `Player ${index + 1}`,
  }));
  return Object.freeze({
    kind: 'pass-and-play',
    mode: 'mixed-quest',
    session: startMultipleChoiceSession({
      gameId: 'mixed-quest',
      sessionId,
      questions: legacyRoundQuestions('mixed-quest'),
    }),
    turns: startTurnRotation(players),
  });
}

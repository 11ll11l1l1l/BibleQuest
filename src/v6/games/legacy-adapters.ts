import type { MultipleChoiceQuestion, MultipleChoiceSessionState } from './contracts.ts';
import { legacyRoundQuestions, type LegacyMultipleChoiceMode } from './legacy-question-adapter.ts';
import { advanceMultipleChoice, answerMultipleChoice, finishMultipleChoice, startMultipleChoiceSession } from './session.ts';
import { advanceTurn, awardCurrentPlayer, startTurnRotation, type TurnState } from './turns.ts';

const LOCAL_ONLY_SCORE_POLICY = Object.freeze({ correctXp: 0, incorrectXp: 0 });

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

export interface LegacyPassAndPlayTransition {
  readonly applied: boolean;
  readonly duplicate: boolean;
  readonly state: LegacyPassAndPlayAdapterSession;
}

function passAndPlayState(
  session: MultipleChoiceSessionState,
  turns: TurnState,
): LegacyPassAndPlayAdapterSession {
  return Object.freeze({
    kind: 'pass-and-play',
    mode: 'mixed-quest',
    session,
    turns,
  });
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
  questions: readonly MultipleChoiceQuestion[] = legacyRoundQuestions('mixed-quest'),
): LegacyPassAndPlayAdapterSession {
  if (!Number.isInteger(playerCount) || playerCount < 2 || playerCount > 6) {
    throw new Error('Play Together requires 2 to 6 players.');
  }
  const players = Array.from({ length: playerCount }, (_, index) => ({
    id: `player-${index + 1}`,
    name: `Player ${index + 1}`,
  }));
  return passAndPlayState(
    startMultipleChoiceSession({
      gameId: 'mixed-quest',
      sessionId,
      questions,
    }),
    startTurnRotation(players),
  );
}

export function answerLegacyPassAndPlaySession(
  current: LegacyPassAndPlayAdapterSession,
  choiceIndex: number,
): LegacyPassAndPlayTransition {
  let transition;
  try {
    transition = answerMultipleChoice(current.session, choiceIndex, LOCAL_ONLY_SCORE_POLICY);
  } catch (error) {
    if (error instanceof Error && error.message === 'Choose one of the available game answers.') {
      throw new Error('Choose one of the available answers.');
    }
    throw error;
  }
  const turns = transition.applied && transition.state.correct
    ? awardCurrentPlayer(current.turns, 1)
    : current.turns;
  return Object.freeze({
    applied: transition.applied,
    duplicate: transition.duplicate,
    state: passAndPlayState(transition.state, turns),
  });
}

export function advanceLegacyPassAndPlaySession(
  current: LegacyPassAndPlayAdapterSession,
): LegacyPassAndPlayTransition {
  let transition;
  try {
    transition = advanceMultipleChoice(current.session);
  } catch (error) {
    if (error instanceof Error && error.message === 'Answer the current game question before continuing.') {
      throw new Error('Answer the current Play Together question before continuing.');
    }
    throw error;
  }
  const turns = transition.applied && transition.state.phase === 'question'
    ? advanceTurn(current.turns)
    : current.turns;
  return Object.freeze({
    applied: transition.applied,
    duplicate: transition.duplicate,
    state: passAndPlayState(transition.state, turns),
  });
}

export function finishLegacyPassAndPlaySession(
  current: LegacyPassAndPlayAdapterSession,
): LegacyPassAndPlayTransition {
  const transition = finishMultipleChoice(current.session);
  return Object.freeze({
    applied: transition.applied,
    duplicate: transition.duplicate,
    state: passAndPlayState(transition.state, current.turns),
  });
}

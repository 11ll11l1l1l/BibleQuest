import type {
  GameResult,
  MultipleChoiceQuestion,
  MultipleChoiceSessionState,
} from './contracts.ts';
import {
  feedbackView,
  questionView,
  resultView,
  type GameFeedbackView,
  type GameQuestionView,
  type GameResultView,
} from './presentation.ts';

interface LegacyLiveQuestion {
  readonly id: string;
  readonly q: string;
  readonly choices: readonly string[];
  readonly answer: number;
  readonly why?: string;
  readonly ref?: string;
}

export interface LegacyLiveQuestionState {
  readonly phase: 'question';
  readonly mode: string;
  readonly roundId: string;
  readonly index: number;
  readonly total: number;
  readonly score: number;
  readonly gained: number;
  readonly locked: boolean;
  readonly selected: number | null;
  readonly correct: boolean | null;
  readonly question: LegacyLiveQuestion | null;
}

export interface LegacyLiveQuestionPresentation {
  readonly question: GameQuestionView;
  readonly feedback: GameFeedbackView | null;
  readonly progressPercent: number;
}

export interface LegacyLiveResultState {
  readonly phase: 'complete';
  readonly mode: string;
  readonly roundId: string | null;
  readonly score: number;
  readonly total: number;
  readonly gained: number;
}

export interface LegacyLiveResultPresentation extends GameResultView {
  readonly accuracyPercent: number;
}

function requireInteger(value: unknown, message: string, minimum = 0): number {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum) throw new Error(message);
  return number;
}

function currentQuestionState(input: LegacyLiveQuestionState): MultipleChoiceSessionState {
  if (!input || input.phase !== 'question') throw new Error('Live game presentation requires an active question.');
  const mode = String(input.mode ?? '').trim();
  const roundId = String(input.roundId ?? '').trim();
  const index = requireInteger(input.index, 'Live game question index is invalid.');
  const total = requireInteger(input.total, 'Live game question total is invalid.', 1);
  const score = requireInteger(input.score, 'Live game score is invalid.');
  const gained = requireInteger(input.gained, 'Live game XP is invalid.');
  if (!mode) throw new Error('Live game mode is missing.');
  if (!roundId || roundId.length > 100) throw new Error('Live game round identity is invalid.');
  if (index >= total) throw new Error('Live game question index exceeds the round total.');
  if (score > index + (input.locked ? 1 : 0)) throw new Error('Live game score exceeds answered questions.');

  const source = input.question;
  if (!source) throw new Error('Live game question is missing.');
  const id = String(source.id ?? '').trim();
  const prompt = String(source.q ?? '').trim();
  const choices = Array.isArray(source.choices)
    ? source.choices.map((choice) => String(choice ?? '').trim())
    : [];
  const answerIndex = Number(source.answer);
  if (!id || id.length > 100) throw new Error('Live game question id is invalid.');
  if (!prompt) throw new Error('Live game question prompt is missing.');
  if (choices.length < 2 || choices.some((choice) => !choice)) {
    throw new Error('Live game question requires at least two choices.');
  }
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= choices.length) {
    throw new Error('Live game answer index is invalid.');
  }

  const selectedIndex = input.selected === null ? null : Number(input.selected);
  if (
    selectedIndex !== null
    && (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= choices.length)
  ) {
    throw new Error('Live game selected answer is invalid.');
  }
  if (input.locked && (selectedIndex === null || typeof input.correct !== 'boolean')) {
    throw new Error('Locked live game question requires answer feedback.');
  }
  if (!input.locked && (selectedIndex !== null || input.correct !== null)) {
    throw new Error('Unlocked live game question cannot expose answer feedback.');
  }
  if (input.locked && input.correct !== (selectedIndex === answerIndex)) {
    throw new Error('Locked live game feedback contradicts the selected answer.');
  }

  const question: MultipleChoiceQuestion = Object.freeze({
    id,
    prompt,
    choices: Object.freeze(choices),
    answerIndex,
    explanation: String(source.why ?? '').trim() || undefined,
    reference: String(source.ref ?? '').trim() || undefined,
  });

  return Object.freeze({
    version: 1,
    gameId: mode,
    sessionId: roundId,
    phase: 'question',
    questions: Object.freeze([question]),
    index: 0,
    score,
    xp: gained,
    locked: input.locked,
    selectedIndex,
    correct: input.correct,
    answers: Object.freeze([]),
  });
}

export function legacyLiveQuestionPresentation(
  input: LegacyLiveQuestionState,
): LegacyLiveQuestionPresentation {
  const state = currentQuestionState(input);
  const base = questionView(state);
  const total = Number(input.total);
  const index = Number(input.index);
  const question = Object.freeze({
    ...base,
    progressLabel: `Question ${index + 1} of ${total}`,
  });
  return Object.freeze({
    question,
    feedback: state.locked ? feedbackView(state) : null,
    progressPercent: Math.round((index / total) * 100),
  });
}

export function legacyLiveResultPresentation(
  input: LegacyLiveResultState,
): LegacyLiveResultPresentation {
  if (!input || input.phase !== 'complete') throw new Error('Live game result requires a completed round.');
  const score = requireInteger(input.score, 'Live game result score is invalid.');
  const total = requireInteger(input.total, 'Live game result total is invalid.', 1);
  const gained = requireInteger(input.gained, 'Live game result XP is invalid.');
  if (score > total) throw new Error('Live game result score exceeds its total.');

  const result: GameResult = Object.freeze({
    gameId: String(input.mode ?? '').trim() || 'unknown-game',
    sessionId: String(input.roundId ?? '').trim() || 'completed-round',
    score,
    total,
    xp: gained,
    answered: total,
    completed: true,
  });
  const view = resultView(result);
  const accuracyPercent = Number.parseInt(view.accuracyLabel, 10);
  if (!Number.isSafeInteger(accuracyPercent)) throw new Error('Live game result accuracy is invalid.');
  return Object.freeze({ ...view, accuracyPercent });
}

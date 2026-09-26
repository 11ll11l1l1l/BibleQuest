import type {
  GameResult,
  GameScorePolicy,
  GameSessionTransition,
  MultipleChoiceAction,
  MultipleChoiceQuestion,
  MultipleChoiceSessionState,
} from './contracts.ts';
import { scoreMultipleChoiceAnswer, validateScorePolicy } from './scoring.ts';

const SESSION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/;
const GAME_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeQuestion(question: MultipleChoiceQuestion): MultipleChoiceQuestion {
  const id = String(question?.id ?? '').trim();
  const prompt = String(question?.prompt ?? '').trim();
  const choices = Array.isArray(question?.choices)
    ? question.choices.map((choice) => String(choice ?? '').trim())
    : [];
  const answerIndex = Number(question?.answerIndex);

  if (!id || id.length > 100) throw new Error('Game question id is invalid.');
  if (!prompt) throw new Error(`Game question ${id} is missing a prompt.`);
  if (choices.length < 2 || choices.some((choice) => !choice)) {
    throw new Error(`Game question ${id} requires at least two non-empty choices.`);
  }
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= choices.length) {
    throw new Error(`Game question ${id} has an invalid answer index.`);
  }

  return Object.freeze({
    id,
    prompt,
    choices: Object.freeze(choices),
    answerIndex,
    explanation: question.explanation ? String(question.explanation).trim() : undefined,
    reference: question.reference ? String(question.reference).trim() : undefined,
  });
}

function normalizeQuestions(input: readonly MultipleChoiceQuestion[]): readonly MultipleChoiceQuestion[] {
  if (!Array.isArray(input) || input.length === 0) throw new Error('Game session requires questions.');
  const seen = new Set<string>();
  const questions = input.map((question) => {
    const normalized = normalizeQuestion(question);
    if (seen.has(normalized.id)) throw new Error(`Duplicate game question id: ${normalized.id}.`);
    seen.add(normalized.id);
    return normalized;
  });
  return Object.freeze(questions);
}

function freezeState(state: MultipleChoiceSessionState): MultipleChoiceSessionState {
  return Object.freeze({
    ...state,
    questions: Object.freeze([...state.questions]),
    answers: Object.freeze(state.answers.map((answer) => Object.freeze({ ...answer }))),
  });
}

export function startMultipleChoiceSession(input: {
  readonly gameId: string;
  readonly sessionId: string;
  readonly questions: readonly MultipleChoiceQuestion[];
}): MultipleChoiceSessionState {
  const gameId = String(input?.gameId ?? '').trim();
  const sessionId = String(input?.sessionId ?? '').trim();
  if (!GAME_ID_PATTERN.test(gameId)) throw new Error('Game session requires a valid game id.');
  if (!SESSION_ID_PATTERN.test(sessionId)) throw new Error('Game session requires a valid session id.');

  return freezeState({
    version: 1,
    gameId,
    sessionId,
    phase: 'question',
    questions: normalizeQuestions(input.questions),
    index: 0,
    score: 0,
    xp: 0,
    locked: false,
    selectedIndex: null,
    correct: null,
    answers: Object.freeze([]),
  });
}

export function answerMultipleChoice(
  state: MultipleChoiceSessionState,
  choiceIndex: number,
  policy: GameScorePolicy,
): GameSessionTransition {
  validateScorePolicy(policy);
  if (state.phase !== 'question') throw new Error('Game session is already complete.');
  if (state.locked) return Object.freeze({ applied: false, duplicate: true, state });

  const question = state.questions[state.index];
  if (!question) throw new Error('Game session question state is invalid.');

  const selectedIndex = Number(choiceIndex);
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= question.choices.length) {
    throw new Error('Choose one of the available game answers.');
  }

  const correct = selectedIndex === question.answerIndex;
  const xp = scoreMultipleChoiceAnswer(correct, policy);
  const next = freezeState({
    ...state,
    score: state.score + (correct ? 1 : 0),
    xp: state.xp + xp,
    locked: true,
    selectedIndex,
    correct,
    answers: Object.freeze([
      ...state.answers,
      Object.freeze({ questionId: question.id, selectedIndex, correct, xp }),
    ]),
  });

  return Object.freeze({ applied: true, duplicate: false, state: next });
}

export function finishMultipleChoice(state: MultipleChoiceSessionState): GameSessionTransition {
  if (state.phase === 'complete') return Object.freeze({ applied: false, duplicate: true, state });
  const complete = freezeState({
    ...state,
    phase: 'complete',
    index: state.questions.length,
    locked: false,
    selectedIndex: null,
    correct: null,
  });
  return Object.freeze({ applied: true, duplicate: false, state: complete });
}

export function advanceMultipleChoice(state: MultipleChoiceSessionState): GameSessionTransition {
  if (state.phase !== 'question') return Object.freeze({ applied: false, duplicate: true, state });
  if (!state.locked) throw new Error('Answer the current game question before continuing.');

  if (state.index + 1 >= state.questions.length) {
    const complete = freezeState({
      ...state,
      phase: 'complete',
      index: state.questions.length,
      locked: false,
      selectedIndex: null,
      correct: null,
    });
    return Object.freeze({ applied: true, duplicate: false, state: complete });
  }

  const next = freezeState({
    ...state,
    index: state.index + 1,
    locked: false,
    selectedIndex: null,
    correct: null,
  });
  return Object.freeze({ applied: true, duplicate: false, state: next });
}

export function applyMultipleChoiceAction(
  state: MultipleChoiceSessionState,
  action: MultipleChoiceAction,
  policy: GameScorePolicy,
): GameSessionTransition {
  if (action.type === 'answer') return answerMultipleChoice(state, action.choiceIndex, policy);
  if (action.type === 'next') return advanceMultipleChoice(state);
  const neverAction: never = action;
  throw new Error(`Unsupported game action: ${String((neverAction as { type?: string })?.type ?? '')}.`);
}

export function replayMultipleChoiceActions(
  initial: MultipleChoiceSessionState,
  actions: readonly MultipleChoiceAction[],
  policy: GameScorePolicy,
): MultipleChoiceSessionState {
  let state = initial;
  for (const action of actions) state = applyMultipleChoiceAction(state, action, policy).state;
  return state;
}

export function gameResult(state: MultipleChoiceSessionState): GameResult {
  return Object.freeze({
    gameId: state.gameId,
    sessionId: state.sessionId,
    score: state.score,
    total: state.questions.length,
    xp: state.xp,
    answered: state.answers.length,
    completed: state.phase === 'complete',
  });
}

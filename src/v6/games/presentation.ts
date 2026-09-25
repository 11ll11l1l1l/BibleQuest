import type {
  GameResult,
  MultipleChoiceQuestion,
  MultipleChoiceSessionState,
} from './contracts.ts';
import type { TurnState } from './turns.ts';

export interface GameChoiceView {
  readonly index: number;
  readonly marker: string;
  readonly text: string;
  readonly accessibleLabel: string;
  readonly selected: boolean;
  readonly correct: boolean | null;
}

export interface GameQuestionView {
  readonly questionId: string;
  readonly prompt: string;
  readonly progressLabel: string;
  readonly choices: readonly GameChoiceView[];
}

export interface GameFeedbackView {
  readonly status: 'correct' | 'incorrect';
  readonly heading: string;
  readonly explanation: string;
  readonly reference: string;
}

export interface GameResultView {
  readonly scoreLabel: string;
  readonly accuracyLabel: string;
  readonly xpLabel: string;
  readonly completed: boolean;
}

export interface GameScoreboardEntryView {
  readonly playerId: string;
  readonly name: string;
  readonly score: number;
  readonly active: boolean;
  readonly accessibleLabel: string;
}

function currentQuestion(state: MultipleChoiceSessionState): MultipleChoiceQuestion {
  if (state.phase !== 'question') throw new Error('Game question presentation requires an active question.');
  const question = state.questions[state.index];
  if (!question) throw new Error('Game question presentation state is invalid.');
  return question;
}

export function questionView(state: MultipleChoiceSessionState): GameQuestionView {
  const question = currentQuestion(state);
  return Object.freeze({
    questionId: question.id,
    prompt: question.prompt,
    progressLabel: `Question ${state.index + 1} of ${state.questions.length}`,
    choices: Object.freeze(question.choices.map((text, index) => {
      const marker = String.fromCharCode(65 + index);
      return Object.freeze({
        index,
        marker,
        text,
        accessibleLabel: `Answer ${marker}: ${text}`,
        selected: state.selectedIndex === index,
        correct: state.locked ? index === question.answerIndex : null,
      });
    })),
  });
}

export function feedbackView(state: MultipleChoiceSessionState): GameFeedbackView {
  const question = currentQuestion(state);
  if (!state.locked || state.correct === null) throw new Error('Answer the question before showing feedback.');
  return Object.freeze({
    status: state.correct ? 'correct' : 'incorrect',
    heading: state.correct ? 'Correct' : 'Review this one',
    explanation: String(question.explanation ?? '').trim(),
    reference: String(question.reference ?? '').trim(),
  });
}

export function resultView(result: GameResult): GameResultView {
  const total = Number(result.total);
  if (!Number.isSafeInteger(total) || total < 1) throw new Error('Game result requires a positive total.');
  const score = Number(result.score);
  if (!Number.isSafeInteger(score) || score < 0 || score > total) throw new Error('Game result score is invalid.');
  const accuracy = Math.round((score / total) * 100);
  return Object.freeze({
    scoreLabel: `${score}/${total}`,
    accuracyLabel: `${accuracy}% accuracy`,
    xpLabel: `+${result.xp} XP`,
    completed: result.completed,
  });
}

export function scoreboardView(turns: TurnState): readonly GameScoreboardEntryView[] {
  return Object.freeze(turns.players.map((player, index) => Object.freeze({
    playerId: player.id,
    name: player.name,
    score: player.score,
    active: index === turns.currentIndex,
    accessibleLabel: `${player.name}: ${player.score} point${player.score === 1 ? '' : 's'}${index === turns.currentIndex ? ', current turn' : ''}`,
  })));
}

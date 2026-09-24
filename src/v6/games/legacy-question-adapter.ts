import { buildGameRound } from '../../features/games/content.js';
import type { MultipleChoiceQuestion } from './contracts.ts';

export type LegacyMultipleChoiceMode = 'quick-recall' | 'context-challenge' | 'mixed-quest';

function isMode(value: string): value is LegacyMultipleChoiceMode {
  return value === 'quick-recall' || value === 'context-challenge' || value === 'mixed-quest';
}

export function legacyRoundQuestions(mode: string): readonly MultipleChoiceQuestion[] {
  const normalized = String(mode ?? '').trim();
  if (!isMode(normalized)) throw new Error('Only migrated legacy multiple-choice modes can use the V6 session adapter.');

  const questions = buildGameRound(normalized).map((row) =>
    Object.freeze({
      id: String(row.id),
      prompt: String(row.q),
      choices: Object.freeze(row.choices.map((choice: unknown) => String(choice))),
      answerIndex: Number(row.answer),
      explanation: String(row.why ?? '').trim() || undefined,
      reference: String(row.ref ?? '').trim() || undefined,
    }),
  );
  if (questions.length === 0) throw new Error(`Legacy game ${normalized} has no verified questions.`);
  return Object.freeze(questions);
}

import { buildGameRound } from '../../features/games/content.js';
import type { MultipleChoiceQuestion } from './contracts.ts';

export type LegacyMultipleChoiceMode = 'quick-recall' | 'context-challenge' | 'mixed-quest';

export interface LegacyMultipleChoiceQuestionRow {
  readonly id: unknown;
  readonly q: unknown;
  readonly choices: readonly unknown[];
  readonly answer: unknown;
  readonly why?: unknown;
  readonly ref?: unknown;
}

function isMode(value: string): value is LegacyMultipleChoiceMode {
  return value === 'quick-recall' || value === 'context-challenge' || value === 'mixed-quest';
}

export function adaptLegacyQuestions(
  rows: readonly LegacyMultipleChoiceQuestionRow[],
): readonly MultipleChoiceQuestion[] {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('Legacy game has no verified questions.');
  const questions = rows.map((row) =>
    Object.freeze({
      id: String(row?.id ?? ''),
      prompt: String(row?.q ?? ''),
      choices: Object.freeze(Array.isArray(row?.choices) ? row.choices.map((choice) => String(choice)) : []),
      answerIndex: Number(row?.answer),
      explanation: String(row?.why ?? '').trim() || undefined,
      reference: String(row?.ref ?? '').trim() || undefined,
    }),
  );
  return Object.freeze(questions);
}

export function legacyRoundQuestions(mode: string): readonly MultipleChoiceQuestion[] {
  const normalized = String(mode ?? '').trim();
  if (!isMode(normalized)) throw new Error('Only migrated legacy multiple-choice modes can use the V6 session adapter.');
  return adaptLegacyQuestions(buildGameRound(normalized));
}

import type { GameScorePolicy } from './contracts.ts';

export const LEGACY_MULTIPLE_CHOICE_SCORE_POLICY: GameScorePolicy = Object.freeze({
  correctXp: 10,
  incorrectXp: 3,
});

function validXp(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

export function validateScorePolicy(policy: GameScorePolicy): GameScorePolicy {
  if (!policy || !validXp(policy.correctXp) || !validXp(policy.incorrectXp)) {
    throw new Error('Game score policy must use non-negative integer XP values.');
  }
  return Object.freeze({ correctXp: policy.correctXp, incorrectXp: policy.incorrectXp });
}

export function scoreMultipleChoiceAnswer(correct: boolean, policy: GameScorePolicy): number {
  const normalized = validateScorePolicy(policy);
  return correct ? normalized.correctXp : normalized.incorrectXp;
}

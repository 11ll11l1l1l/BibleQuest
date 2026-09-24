import assert from 'node:assert/strict';
import test from 'node:test';
import { startLegacySoloSession } from '../../src/v6/games/legacy-adapters.ts';
import { feedbackView, questionView, resultView, scoreboardView } from '../../src/v6/games/presentation.ts';
import { LEGACY_MULTIPLE_CHOICE_SCORE_POLICY } from '../../src/v6/games/scoring.ts';
import { answerMultipleChoice, gameResult } from '../../src/v6/games/session.ts';
import { awardCurrentPlayer, startTurnRotation } from '../../src/v6/games/turns.ts';

test('shared question and feedback presentation stays semantic and DOM-independent', () => {
  const started = startLegacySoloSession('quick-recall', 'presentation-1').session;
  const question = questionView(started);
  assert.equal(question.questionId, 'q1');
  assert.equal(question.progressLabel, 'Question 1 of 10');
  assert.equal(question.choices[1].accessibleLabel, 'Answer B: Noah');
  assert.equal(question.choices.every((choice) => choice.correct === null), true);

  const answered = answerMultipleChoice(started, 1, LEGACY_MULTIPLE_CHOICE_SCORE_POLICY).state;
  const feedback = feedbackView(answered);
  assert.equal(feedback.status, 'correct');
  assert.equal(feedback.heading, 'Correct');
  assert.equal(feedback.reference, 'Genesis 6:13–22');
  assert.equal(questionView(answered).choices[1].selected, true);
});

test('shared result presentation derives labels from the engine result contract', () => {
  const started = startLegacySoloSession('quick-recall', 'presentation-2').session;
  const answered = answerMultipleChoice(started, 1, LEGACY_MULTIPLE_CHOICE_SCORE_POLICY).state;
  const view = resultView(gameResult(answered));
  assert.equal(view.scoreLabel, '1/10');
  assert.equal(view.accuracyLabel, '10% accuracy');
  assert.equal(view.xpLabel, '+10 XP');
  assert.equal(view.completed, false);
});

test('scoreboard labels remain semantic and independent from decorative artwork', () => {
  let turns = startTurnRotation([
    { id: 'p1', name: 'Player 1' },
    { id: 'p2', name: 'Player 2' },
  ]);
  turns = awardCurrentPlayer(turns, 1);
  const board = scoreboardView(turns);
  assert.deepEqual(board.map((row) => row.accessibleLabel), [
    'Player 1: 1 point, current turn',
    'Player 2: 0 points',
  ]);
  assert.equal(board.some((row) => /[⭐🏆🎮🪙]/u.test(row.accessibleLabel)), false);
});

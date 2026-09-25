import assert from 'node:assert/strict';
import test from 'node:test';

import {
  legacyLiveQuestionPresentation,
  legacyLiveResultPresentation,
} from '../../src/v6/games/live-presentation.ts';

const questionState = {
  phase: 'question' as const,
  mode: 'quick-recall',
  roundId: 'round-1',
  index: 2,
  total: 10,
  score: 1,
  gained: 13,
  locked: false,
  selected: null,
  correct: null,
  question: {
    id: 'q3',
    q: 'Which answer is correct?',
    choices: ['First', 'Second', 'Third'],
    answer: 1,
    why: 'The second answer is correct.',
    ref: 'John 3:16',
  },
};

test('live Games question presentation uses V6 progress and accessibility semantics', () => {
  const view = legacyLiveQuestionPresentation(questionState);
  assert.equal(view.question.questionId, 'q3');
  assert.equal(view.question.prompt, 'Which answer is correct?');
  assert.equal(view.question.progressLabel, 'Question 3 of 10');
  assert.equal(view.progressPercent, 20);
  assert.equal(view.question.choices[1]?.accessibleLabel, 'Answer B: Second');
  assert.equal(view.question.choices[1]?.correct, null);
  assert.equal(view.feedback, null);
});

test('live Games locked question exposes V6 answer and feedback presentation', () => {
  const view = legacyLiveQuestionPresentation({
    ...questionState,
    locked: true,
    selected: 0,
    correct: false,
  });
  assert.equal(view.question.choices[0]?.selected, true);
  assert.equal(view.question.choices[0]?.correct, false);
  assert.equal(view.question.choices[1]?.correct, true);
  assert.equal(view.feedback?.status, 'incorrect');
  assert.equal(view.feedback?.heading, 'Review this one');
  assert.equal(view.feedback?.explanation, 'The second answer is correct.');
  assert.equal(view.feedback?.reference, 'John 3:16');
});

test('live Games result presentation delegates score, accuracy, and XP labels to V6', () => {
  const view = legacyLiveResultPresentation({
    phase: 'complete',
    mode: 'mixed-quest',
    roundId: 'round-2',
    score: 8,
    total: 10,
    gained: 86,
  });
  assert.equal(view.scoreLabel, '8/10');
  assert.equal(view.accuracyLabel, '80% accuracy');
  assert.equal(view.accuracyPercent, 80);
  assert.equal(view.xpLabel, '+86 XP');
  assert.equal(view.completed, true);
});

test('live Games presentation fails closed for inconsistent answer state', () => {
  assert.throws(
    () => legacyLiveQuestionPresentation({ ...questionState, locked: true }),
    /requires answer feedback/,
  );
  assert.throws(
    () => legacyLiveQuestionPresentation({
      ...questionState,
      locked: true,
      selected: 0,
      correct: true,
    }),
    /contradicts the selected answer/,
  );
  assert.throws(
    () => legacyLiveResultPresentation({
      phase: 'complete',
      mode: 'quick-recall',
      roundId: 'round-3',
      score: 11,
      total: 10,
      gained: 100,
    }),
    /score exceeds/,
  );
});

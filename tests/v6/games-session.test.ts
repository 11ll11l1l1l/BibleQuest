import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advanceMultipleChoice,
  answerMultipleChoice,
  finishMultipleChoice,
  gameResult,
  replayMultipleChoiceActions,
  startMultipleChoiceSession,
} from '../../src/v6/games/session.ts';
import {
  LEGACY_MULTIPLE_CHOICE_SCORE_POLICY,
  scoreMultipleChoiceAnswer,
} from '../../src/v6/games/scoring.ts';

const questions = Object.freeze([
  Object.freeze({
    id: 'q1',
    prompt: 'Who built the ark?',
    choices: Object.freeze(['Moses', 'Noah', 'David']),
    answerIndex: 1,
    reference: 'Genesis 6',
  }),
  Object.freeze({
    id: 'q2',
    prompt: 'Who led Israel out of Egypt?',
    choices: Object.freeze(['Moses', 'Paul', 'Peter']),
    answerIndex: 0,
    reference: 'Exodus 3–14',
  }),
]);

test('multiple-choice scoring is isolated from rendering and matches the current V5 policy', () => {
  assert.equal(scoreMultipleChoiceAnswer(true, LEGACY_MULTIPLE_CHOICE_SCORE_POLICY), 10);
  assert.equal(scoreMultipleChoiceAnswer(false, LEGACY_MULTIPLE_CHOICE_SCORE_POLICY), 3);
});

test('multiple-choice session is deterministic and duplicate answers cannot farm XP', () => {
  const initial = startMultipleChoiceSession({
    gameId: 'quick-recall',
    sessionId: 'session-1',
    questions,
  });

  const first = answerMultipleChoice(initial, 1, LEGACY_MULTIPLE_CHOICE_SCORE_POLICY);
  assert.equal(first.applied, true);
  assert.equal(first.state.score, 1);
  assert.equal(first.state.xp, 10);

  const duplicate = answerMultipleChoice(first.state, 1, LEGACY_MULTIPLE_CHOICE_SCORE_POLICY);
  assert.equal(duplicate.applied, false);
  assert.equal(duplicate.duplicate, true);
  assert.strictEqual(duplicate.state, first.state);
  assert.equal(duplicate.state.xp, 10);

  const secondQuestion = advanceMultipleChoice(first.state).state;
  const wrong = answerMultipleChoice(secondQuestion, 2, LEGACY_MULTIPLE_CHOICE_SCORE_POLICY).state;
  const complete = advanceMultipleChoice(wrong).state;

  assert.deepEqual(gameResult(complete), {
    gameId: 'quick-recall',
    sessionId: 'session-1',
    score: 1,
    total: 2,
    xp: 13,
    answered: 2,
    completed: true,
  });

  const replayed = replayMultipleChoiceActions(
    initial,
    [
      { type: 'answer', choiceIndex: 1 },
      { type: 'next' },
      { type: 'answer', choiceIndex: 2 },
      { type: 'next' },
    ],
    LEGACY_MULTIPLE_CHOICE_SCORE_POLICY,
  );
  assert.deepEqual(replayed, complete);
});

test('multiple-choice session supports deterministic early completion without inventing answers', () => {
  const initial = startMultipleChoiceSession({
    gameId: 'mixed-quest',
    sessionId: 'early-finish-1',
    questions,
  });
  const answered = answerMultipleChoice(initial, 1, LEGACY_MULTIPLE_CHOICE_SCORE_POLICY).state;
  const finished = finishMultipleChoice(answered);

  assert.equal(finished.applied, true);
  assert.equal(finished.duplicate, false);
  assert.equal(finished.state.phase, 'complete');
  assert.equal(finished.state.index, questions.length);
  assert.equal(finished.state.score, 1);
  assert.equal(finished.state.xp, 10);
  assert.equal(finished.state.answers.length, 1);
  assert.equal(finished.state.locked, false);
  assert.equal(finished.state.selectedIndex, null);
  assert.equal(finished.state.correct, null);
  assert.deepEqual(gameResult(finished.state), {
    gameId: 'mixed-quest',
    sessionId: 'early-finish-1',
    score: 1,
    total: 2,
    xp: 10,
    answered: 1,
    completed: true,
  });

  const duplicate = finishMultipleChoice(finished.state);
  assert.equal(duplicate.applied, false);
  assert.equal(duplicate.duplicate, true);
  assert.strictEqual(duplicate.state, finished.state);
});

test('multiple-choice session fails closed for invalid question and transition state', () => {
  assert.throws(
    () =>
      startMultipleChoiceSession({
        gameId: 'quick-recall',
        sessionId: 'session-2',
        questions: [{ id: 'bad', prompt: 'Bad', choices: ['A'], answerIndex: 0 }],
      }),
    /at least two/,
  );

  const initial = startMultipleChoiceSession({
    gameId: 'quick-recall',
    sessionId: 'session-3',
    questions,
  });
  assert.throws(() => advanceMultipleChoice(initial), /Answer the current/);
  assert.throws(
    () => answerMultipleChoice(initial, 9, LEGACY_MULTIPLE_CHOICE_SCORE_POLICY),
    /available game answers/,
  );
});

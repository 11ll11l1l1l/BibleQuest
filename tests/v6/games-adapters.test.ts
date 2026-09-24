import assert from 'node:assert/strict';
import test from 'node:test';
import { startLegacyPassAndPlaySession, startLegacySoloSession } from '../../src/v6/games/legacy-adapters.ts';
import { legacyRoundQuestions } from '../../src/v6/games/legacy-question-adapter.ts';
import { advanceTurn, awardCurrentPlayer, startTurnRotation } from '../../src/v6/games/turns.ts';

test('legacy question adapter preserves current verified question identity and references', () => {
  const quick = legacyRoundQuestions('quick-recall');
  assert.equal(quick.length, 10);
  assert.equal(quick[0].id, 'q1');
  assert.equal(quick[0].answerIndex, 1);
  assert.equal(quick[0].reference, 'Genesis 6:13–22');

  const mixed = legacyRoundQuestions('mixed-quest');
  assert.deepEqual(mixed.map((question) => question.id), ['q1','q5','q9','q11','q15','q16','q19','q22','q23','q21']);
  assert.throws(() => legacyRoundQuestions('timeline-challenge'), /migrated legacy multiple-choice/);
});

test('solo and pass-and-play adapters share the same V6 multiple-choice engine/content boundary', () => {
  const solo = startLegacySoloSession('mixed-quest', 'solo-1');
  const together = startLegacyPassAndPlaySession('together-1', 3);

  assert.equal(solo.kind, 'solo');
  assert.equal(together.kind, 'pass-and-play');
  assert.deepEqual(
    solo.session.questions.map((question) => question.id),
    together.session.questions.map((question) => question.id),
  );
  assert.deepEqual(together.turns.players.map((player) => player.name), ['Player 1', 'Player 2', 'Player 3']);
});

test('turn rotation isolates score and rotates deterministically without a DOM or timer', () => {
  let turns = startTurnRotation([
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
  ]);
  turns = awardCurrentPlayer(turns, 1);
  assert.deepEqual(turns.players.map((player) => player.score), [1, 0]);
  turns = advanceTurn(turns);
  assert.equal(turns.currentIndex, 1);
  assert.equal(turns.turn, 2);
  turns = awardCurrentPlayer(turns, 1);
  turns = advanceTurn(turns);
  assert.equal(turns.currentIndex, 0);
  assert.equal(turns.turn, 3);
  assert.deepEqual(turns.players.map((player) => player.score), [1, 1]);

  assert.throws(() => startTurnRotation([{ id: 'only', name: 'Only' }]), /2 to 6/);
  assert.throws(() => awardCurrentPlayer(turns, -1), /non-negative/);
});

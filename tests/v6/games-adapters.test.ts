import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advanceLegacyPassAndPlaySession,
  answerLegacyPassAndPlaySession,
  finishLegacyPassAndPlaySession,
  startLegacyPassAndPlaySession,
  startLegacySoloSession,
} from '../../src/v6/games/legacy-adapters.ts';
import { adaptLegacyQuestions, legacyRoundQuestions } from '../../src/v6/games/legacy-question-adapter.ts';
import { legacyGameRegistry } from '../../src/v6/games/legacy-registry.ts';
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

test('pass-and-play adapter accepts a moderation-filtered bank without re-owning question logic', () => {
  const filtered = adaptLegacyQuestions([
    { id: 'safe-1', q: 'First?', choices: ['Yes', 'No'], answer: 0, why: 'First explanation.', ref: 'John 1:1' },
    { id: 'safe-2', q: 'Second?', choices: ['Left', 'Right'], answer: 1, why: 'Second explanation.', ref: 'John 1:2' },
  ]);
  const together = startLegacyPassAndPlaySession('filtered-1', 2, filtered);

  assert.throws(
    () => answerLegacyPassAndPlaySession(together, -1),
    /Choose one of the available answers\./,
    'adapter must preserve the accepted Play Together validation copy',
  );
  assert.throws(
    () => advanceLegacyPassAndPlaySession(together),
    /Answer the current Play Together question before continuing\./,
    'adapter must preserve the accepted unanswered-question validation copy',
  );

  assert.deepEqual(together.session.questions.map((question) => question.id), ['safe-1', 'safe-2']);
  assert.equal(together.session.xp, 0);

  const answered = answerLegacyPassAndPlaySession(together, 0);
  assert.equal(answered.applied, true);
  assert.equal(answered.state.session.locked, true);
  assert.equal(answered.state.session.correct, true);
  assert.equal(answered.state.session.xp, 0, 'local Play Together must never award profile XP');
  assert.deepEqual(answered.state.turns.players.map((player) => player.score), [1, 0]);

  const duplicate = answerLegacyPassAndPlaySession(answered.state, 0);
  assert.equal(duplicate.applied, false);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.state.session.answers.length, 1);
  assert.deepEqual(duplicate.state.turns.players.map((player) => player.score), [1, 0]);

  const advanced = advanceLegacyPassAndPlaySession(answered.state);
  assert.equal(advanced.state.session.index, 1);
  assert.equal(advanced.state.turns.currentIndex, 1);

  const wrong = answerLegacyPassAndPlaySession(advanced.state, 0);
  assert.equal(wrong.state.session.correct, false);
  assert.equal(wrong.state.session.xp, 0);
  assert.deepEqual(wrong.state.turns.players.map((player) => player.score), [1, 0]);

  const completed = advanceLegacyPassAndPlaySession(wrong.state);
  assert.equal(completed.state.session.phase, 'complete');
  assert.equal(completed.state.turns.currentIndex, 1, 'completion must not rotate to a phantom next turn');
});

test('pass-and-play early finish completes the shared session without rotating or inventing answers', () => {
  const filtered = adaptLegacyQuestions([
    { id: 'finish-1', q: 'First?', choices: ['Yes', 'No'], answer: 0 },
    { id: 'finish-2', q: 'Second?', choices: ['Left', 'Right'], answer: 1 },
  ]);
  const together = startLegacyPassAndPlaySession('finish-early-1', 2, filtered);
  const answered = answerLegacyPassAndPlaySession(together, 0);
  const finished = finishLegacyPassAndPlaySession(answered.state);

  assert.equal(finished.applied, true);
  assert.equal(finished.duplicate, false);
  assert.equal(finished.state.session.phase, 'complete');
  assert.equal(finished.state.session.index, filtered.length);
  assert.equal(finished.state.session.answers.length, 1);
  assert.equal(finished.state.session.score, 1);
  assert.equal(finished.state.session.xp, 0);
  assert.equal(finished.state.session.locked, false);
  assert.equal(finished.state.session.selectedIndex, null);
  assert.equal(finished.state.session.correct, null);
  assert.equal(finished.state.turns.currentIndex, 0, 'early finish must not rotate players');
  assert.deepEqual(finished.state.turns.players.map((player) => player.score), [1, 0]);

  const duplicate = finishLegacyPassAndPlaySession(finished.state);
  assert.equal(duplicate.applied, false);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.state.session, finished.state.session);
  assert.equal(duplicate.state.turns, finished.state.turns);
  assert.deepEqual(duplicate.state, finished.state);
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

test('remote Games capability remains fail-closed while local pass-and-play is explicit', () => {
  const registry = legacyGameRegistry.list();
  assert.equal(registry.some((game) => game.capabilities.remote), false);
  const together = legacyGameRegistry.require('same-room');
  assert.equal(together.capabilities.solo, false);
  assert.equal(together.capabilities.passAndPlay, true);
  assert.equal(together.capabilities.remote, false);
  assert.equal(together.rewardAuthority, 'local-only');
});

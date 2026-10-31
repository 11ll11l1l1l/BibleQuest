import test from 'node:test';
import assert from 'node:assert/strict';
import { PRACTICES } from '../../src/features/spiritual-practices/content.js';
import { advance, createSession, validSession } from '../../src/features/spiritual-practices/timer.js';
test('source-exact Silencio stages sum to two hours and beginner to ten minutes', () => {
  assert.deepEqual(PRACTICES[0].stages.map(row => row.seconds / 60), [10, 20, 20, 20, 20, 15, 10, 5]);
  assert.equal(PRACTICES[0].stages.reduce((sum, row) => sum + row.seconds, 0), 7200);
  assert.equal(PRACTICES[1].stages.reduce((sum, row) => sum + row.seconds, 0), 600);
});
test('reload and background suspension reconcile multiple stages without losing active time', () => {
  const initial = createSession('silencio-10', 1000, 'one');
  const restored = JSON.parse(JSON.stringify(initial));
  const next = advance(restored, 'tick', 201000);
  assert.equal(next.stage, 2);
  assert.equal(next.remaining, 160000);
  assert.equal(next.elapsed, 200000);
  assert.equal(next.deadline, 361000);
  assert.equal(initial.stage, 0);
});
test('paused duration is excluded and resume establishes a fresh deadline', () => {
  let state = createSession('presence-30', 1000, 'one');
  state = advance(state, 'pause', 11000);
  state = advance(state, 'tick', 991000);
  assert.equal(state.remaining, 20000);
  assert.equal(state.elapsed, 10000);
  state = advance(state, 'resume', 1001000);
  assert.equal(state.deadline, 1021000);
  state = advance(state, 'tick', 1021000);
  assert.equal(state.state, 'completed');
  assert.equal(state.elapsed, 30000);
});
test('skip does not credit skipped time and final skip ends early', () => {
  let state = createSession('silencio-10', 1000, 'one');
  state = advance(state, 'skip', 11000);
  assert.equal(state.elapsed, 10000);
  assert.deepEqual(state.skipped, [0]);
  while (state.stage < 4) state = advance(state, 'skip', 11000);
  state = advance(state, 'skip', 11000);
  assert.equal(state.state, 'ended');
  assert.equal(state.elapsed, 10000);
  assert.equal(validSession(state), true);
});
test('long background completion is bounded and terminal operations are idempotent', () => {
  const state = advance(createSession('silencio-120', 1000, 'one'), 'tick', 999999999);
  assert.equal(state.state, 'completed');
  assert.equal(state.elapsed, 7200000);
  assert.equal(state.remaining, 0);
  assert.deepEqual(advance(state, 'resume', 9999999999), state);
});
test('reject malformed snapshots and tolerate backwards wall-clock movement', () => {
  const state = createSession('silencio-10', 1000, 'one');
  for (const bad of [null, {}, { ...state, stage: 99 }, { ...state, remaining: Infinity }, { ...state, skipped: [99] }, { ...state, templateVersion: 2 }, { ...state, elapsed: -1 }]) assert.equal(validSession(bad), false);
  assert.equal(advance(state, 'tick', 0).remaining, 60000);
  assert.throws(() => advance({}, 'tick', 1000));
});

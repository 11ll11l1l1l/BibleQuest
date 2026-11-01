import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, createSession } from '../../src/features/spiritual-practices/timer.js';
import { getPractice } from '../../src/features/spiritual-practices/content.js';
import { remainingPracticeMs, nextPracticeStage } from '../../src/features/spiritual-practices/stage-summary.js';

test('total practice time includes remaining current and future stages, never past or skipped time', () => {
  const p = getPractice('silencio-10');
  const started = createSession('silencio-10',1000,'test-total');
  assert.equal(remainingPracticeMs(started,p),600000);
  assert.equal(nextPracticeStage(started,p)?.title,'Stillness');
  const transitioned = advance(started,'tick',61000);
  assert.equal(transitioned.stage,1);
  assert.equal(remainingPracticeMs(transitioned,p),540000);
  assert.equal(nextPracticeStage(transitioned,p)?.title,'Scripture meditation');
  const skipped = advance(transitioned,'skip',61000);
  assert.equal(skipped.stage,2);
  assert.equal(skipped.elapsed,60000,'skipped stage cannot be recorded as practiced time');
  assert.equal(remainingPracticeMs(skipped,p),420000);
  assert.equal(nextPracticeStage(skipped,p)?.title,'Gratitude and surrender');
  const paused = advance(skipped,'pause',62000);
  assert.equal(remainingPracticeMs(paused,p),419000);
  const ended = advance(paused,'end',62000);
  assert.equal(remainingPracticeMs(ended,p),0);
  assert.equal(nextPracticeStage(ended,p),null);
});
test('final practice stage has no next-stage preview; a completed session has no countdown', () => {
  const p=getPractice('presence-30');
  const s=createSession('presence-30',1000,'test-final');
  assert.equal(nextPracticeStage(s,p),null);
  assert.equal(remainingPracticeMs(s,p),30000);
  assert.equal(advance(s,'tick',31000).state,'completed');
  assert.equal(remainingPracticeMs(advance(s,'tick',31000),p),0);
});
test('invalid persisted session shapes never leak content or make imaginary time', () => {
  const p=getPractice('silencio-10');
  assert.equal(remainingPracticeMs(null,p),0);
  assert.equal(remainingPracticeMs({stage:-1,state:'running',remaining:100},p),0);
  assert.equal(remainingPracticeMs({stage:999,state:'running',remaining:100},p),0);
  assert.equal(remainingPracticeMs({stage:1,state:'running',remaining:NaN},p),0);
  assert.equal(nextPracticeStage({stage:0,state:'ended'},p),null);
});

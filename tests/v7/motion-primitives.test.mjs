import test from 'node:test';
import assert from 'node:assert/strict';
import { V7_MOTION_API_VERSION, V7_MOTION_TOKENS, motionEnabled,
  cleanupMotion, pageTransition, pressFeedback, cardReveal, deckSpring } from '../../src/ui/motion.js';

const normal = { document: { documentElement: { dataset: {} } },
  matchMedia: () => ({ matches: false }) };
const reduced = { document: { documentElement: { dataset: { bqEffectiveMotion: 'reduce' } } },
  matchMedia: () => ({ matches: false }) };
function elementFixture() {
  const records = [];
  return { records, element: {
    animate(frames, options) {
      const animation = { frames, options, cancelled: 0, cancel() { this.cancelled++; },
        finished: new Promise(() => {}) };
      records.push(animation);
      return animation;
    }
  } };
}
test('P0 versioned motion durations stay within the V7 bounds', () => {
  assert.equal(V7_MOTION_API_VERSION, 1);
  assert.ok(V7_MOTION_TOKENS.micro >= 120 && V7_MOTION_TOKENS.micro <= 180);
  assert.ok(V7_MOTION_TOKENS.standard >= 180 && V7_MOTION_TOKENS.standard <= 260);
  assert.ok(V7_MOTION_TOKENS.page >= 260 && V7_MOTION_TOKENS.page <= 400);
  assert.ok(V7_MOTION_TOKENS.card >= 260 && V7_MOTION_TOKENS.card <= 400);
});
test('reduced-motion and media preference disable all nonessential animation', () => {
  assert.equal(motionEnabled(normal), true);
  assert.equal(motionEnabled(reduced), false);
  assert.equal(motionEnabled({ ...normal, matchMedia: () => ({ matches: true }) }), false);
  const f=elementFixture();
  for(const play of [pageTransition, pressFeedback, cardReveal]) play(f.element,{environment:reduced})();
  deckSpring(f.element,{ delta: 20, environment: reduced })();
  assert.equal(f.records.length,0);
});
test('reduced/off motion preference cancels an in-flight effect without replay', () => {
  const f = elementFixture();
  const previous = cardReveal(f.element, { environment: normal });
  assert.equal(f.records.length, 1);
  pressFeedback(f.element, { environment: reduced })();
  assert.equal(f.records[0].cancelled, 1);
  assert.equal(f.records.length, 1, 'no new animation may run in reduced mode');
  previous();
  assert.equal(f.records[0].cancelled, 1, 'stale disposer cannot double-cancel');

  pageTransition(f.element, { environment: normal });
  const off = { ...normal, document: { documentElement: { dataset: { bqMotion: 'off' } } } };
  deckSpring(f.element, { delta: 30, environment: off })();
  assert.equal(f.records[1].cancelled, 1);
  assert.equal(f.records.length, 2, 'off mode must not enqueue effects');
});

test('loss of animation support still cancels the previous effect', () => {
  const f = elementFixture();
  pageTransition(f.element, { environment: normal });
  delete f.element.animate;
  cardReveal(f.element, { environment: normal })();
  assert.equal(f.records[0].cancelled, 1);
});

test('fast interaction cancels stale motion while never delaying state changes', () => {
  const f=elementFixture();
  const old=pageTransition(f.element,{environment:normal});
  const current=pressFeedback(f.element,{environment:normal});
  assert.equal(f.records[0].cancelled,1);
  old();
  assert.equal(f.records[1].cancelled,0);
  current();
  current();
  assert.equal(f.records[1].cancelled,1);
});
test('Home/card and deck effects transform or fade only, with bounded displacement',()=>{
  const f=elementFixture();
  cardReveal(f.element,{environment:normal});
  deckSpring(f.element,{delta:300,environment:normal});
  assert.equal(f.records[0].cancelled,1);
  assert.match(f.records[1].frames[0].transform,/48px/);
  for(const animation of f.records)
    for(const frame of animation.frames)
      assert.ok(Object.keys(frame).every(k=>['transform','opacity'].includes(k)));
  cleanupMotion(f.element);
  assert.equal(f.records[1].cancelled,1);
});
test('lack of WAAPI is a safe immediately-visible no-op',()=>{
  assert.doesNotThrow(()=>pageTransition({}, {environment:normal})());
});

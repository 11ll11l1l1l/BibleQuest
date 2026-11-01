import test from 'node:test';
import assert from 'node:assert/strict';
import { createPracticeCue } from '../../src/features/spiritual-practices/cue.js';
function context() {
  let tones = 0, closed = 0, stops = 0;
  return { state: 'running', currentTime: 0, destination: {}, resume: async () => {}, close: async () => { closed++; }, createOscillator: () => { tones++; return { frequency: { setValueAtTime() {} }, connect() {}, disconnect() {}, start() {}, stop() { stops++; } }; }, createGain: () => ({ gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }), counts: () => ({ tones, closed, stops }) };
}
test('transition cues require explicit enable, do not autoplay and close on disposal', async () => {
  const audio = context(), cue = createPracticeCue({ createContext: () => audio });
  assert.equal(cue.play(), false);
  assert.equal(audio.counts().tones, 0);
  await cue.enable();
  assert.equal(cue.play(), true);
  cue.disable(); assert.equal(cue.play(), false);
  cue.dispose(); assert.equal(audio.counts().closed, 1);
});
test('late audio enable cannot survive account switch or disposal', async () => {
  const audio = context(); let resume;
  audio.resume = () => new Promise(resolve => { resume = resolve; });
  const cue = createPracticeCue({ createContext: () => audio });
  const enabling = cue.enable(); cue.dispose(); resume();
  assert.equal(await enabling, false);
  assert.equal(cue.play(), false);
});
test('suspended audio never queues delayed cues', async () => {
  const audio = context(), cue = createPracticeCue({ createContext: () => audio });
  await cue.enable(); audio.state = 'suspended';
  assert.equal(cue.play(), false);
  audio.state = 'running';
  assert.equal(audio.counts().tones, 0);
  cue.dispose();
});

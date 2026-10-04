import test from 'node:test';
import assert from 'node:assert/strict';
import { createLessonRunnerPage } from '../../src/features/lesson-runner/page.js';

test('mentee response editor escapes restored text and sends edits only to the scoped runner', () => {
  let state = { status: 'ready', responseStatus: 'ready', stepIndex: 1, writable: true, progress: null, error: null,
    responseDrafts: { 'step-1': '<private & restored>' },
    lesson: { steps: [
      { id: 'step-0', type: 'scripture', content: { text: 'Scripture' } },
      { id: 'step-1', type: 'understand', content: { text: 'Question' } },
    ] } };
  let listener, edited, disposed = false;
  const runner = {
    getIdentity: () => ({ pairId: 'pair', revisionId: 'revision' }), getState: () => state,
    subscribe(fn) { listener = fn; return () => {}; }, load() {}, invalidate() {}, dispose() { disposed = true; },
    updateResponse(value, stepId) { edited = { value, stepId }; state = { ...state, responseDrafts: { ...state.responseDrafts, [stepId]: value } }; listener(state); },
  };
  const host = { innerHTML: '', querySelector() { return null; } };
  const handlers = new Map();
  const page = { querySelector: () => host, addEventListener(name, fn) { handlers.set(name, fn); }, removeEventListener(name) { handlers.delete(name); } };
  const ui = createLessonRunnerPage({ runner, onBack() {}, subscribeContext() { return () => {}; } });
  const cleanup = ui.mount({ querySelector: () => page });

  assert.match(host.innerHTML, /data-lesson-response="step-1"/);
  assert.match(host.innerHTML, /&lt;private &amp; restored&gt;/);
  assert.doesNotMatch(host.innerHTML, /<private & restored>/);

  const textarea = { value: 'fresh response', closest() { return this; }, getAttribute(name) { return name === 'data-lesson-response' ? 'step-1' : null; } };
  handlers.get('input')({ target: textarea });
  assert.deepEqual(edited, { value: 'fresh response', stepId: 'step-1' });
  assert.match(host.innerHTML, /fresh response/);

  cleanup();
  assert.equal(disposed, true);
  assert.equal(handlers.size, 0);
});

test('mentor preview renders no private response editor', () => {
  const state = { status: 'ready', responseStatus: 'ready', stepIndex: 1, writable: false, progress: null, error: null, responseDrafts: {},
    lesson: { steps: [{ id: 'step-0', type: 'scripture', content: { text: 'Scripture' } }, { id: 'step-1', type: 'understand', content: { text: 'Question' } }] } };
  const runner = { getIdentity: () => ({ pairId: 'pair', revisionId: 'revision' }), getState: () => state, subscribe() { return () => {}; }, load() {}, invalidate() {}, dispose() {} };
  const host = { innerHTML: '', querySelector() { return null; } };
  const page = { querySelector: () => host, addEventListener() {}, removeEventListener() {} };
  createLessonRunnerPage({ runner, onBack() {}, subscribeContext() { return () => {}; } }).mount({ querySelector: () => page });
  assert.doesNotMatch(host.innerHTML, /data-lesson-response/);
  assert.match(host.innerHTML, /Mentor preview/);
});

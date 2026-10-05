import test from 'node:test';
import assert from 'node:assert/strict';
import { createLessonRunnerPage } from '../../src/features/lesson-runner/page.js';
test('runner page escapes content, hands off Scripture with return step and disposes scope listeners', () => {
  const reference = { book: 'JHN', chapter: 15, verseStart: 7 };
  let state = { status: 'ready', stepIndex: 0, writable: true, progress: null,
    lesson: { steps: [{ id: 'step-0', type: 'scripture', content: { text: '<img src=x onerror=bad>' }, scriptureRefs: [reference] }] } };
  let listener, contextListener, disposed = false, unsubscribed = false, handedOff;
  const runner = { getIdentity: () => ({ pairId: 'pair', revisionId: 'revision' }), getState: () => state, subscribe(fn) { listener = fn; return () => { unsubscribed = true; }; }, load() {},
    invalidate() { state = { status: 'idle', lesson: null }; listener(state); }, dispose() { disposed = true; } };
  const host = { innerHTML: '', querySelector() { return null; } };
  const handlers = new Map();
  const page = { querySelector: () => host, addEventListener(name, fn) { handlers.set(name, fn); }, removeEventListener(name) { handlers.delete(name); } };
  const ui = createLessonRunnerPage({ runner, onBack() {}, onScripture(ref, returnTo) { handedOff = { ref, returnTo }; },
    subscribeContext(fn) { contextListener = fn; return () => { contextListener = null; }; } });
  const cleanup = ui.mount({ querySelector: () => page });
  assert.match(host.innerHTML, /&lt;img/); assert.doesNotMatch(host.innerHTML, /<img/);
  assert.match(host.innerHTML, /data-lesson-complete/);
  const button = { disabled: false, closest() { return this; }, hasAttribute(key) { return key === 'data-lesson-scripture'; }, getAttribute() { return '0'; } };
  handlers.get('click')({ target: button });
  assert.deepEqual(handedOff, { ref: reference, returnTo: { routeKey: 'one-to-one-lesson', pairId: 'pair', revisionId: 'revision', stepId: 'step-0' } });
  contextListener(); assert.doesNotMatch(host.innerHTML, /&lt;img|data-lesson-complete/);
  cleanup(); assert.equal(disposed, true); assert.equal(unsubscribed, true); assert.equal(contextListener, null); assert.equal(handlers.size, 0);
});


test('lesson reads wait for ready context and ignore callbacks after teardown', () => {
  let ready = false, loads = 0, invalidations = 0, contextListener;
  const state = { status: 'idle', lesson: null };
  const runner = { getState: () => state, subscribe() { return () => {}; },
    load() { loads += 1; }, invalidate() { invalidations += 1; }, dispose() {} };
  const host = { innerHTML: '', querySelector() { return null; } };
  const handlers = new Map();
  const page = { querySelector: () => host, addEventListener(name, fn) { handlers.set(name, fn); }, removeEventListener(name) { handlers.delete(name); } };
  const cleanup = createLessonRunnerPage({ runner, onBack() {}, isContextReady: () => ready,
    subscribeContext(fn) { contextListener = fn; return () => {}; } }).mount({ querySelector: () => page });
  const reload = { disabled: false, closest() { return this; }, hasAttribute(key) { return key === 'data-lesson-reload'; } };
  assert.equal(loads, 0, 'mount must wait for hydration');
  handlers.get('click')({ target: reload });
  assert.equal(loads, 0, 'manual reload must also wait');
  contextListener();
  assert.equal(invalidations, 1);
  assert.equal(loads, 0);
  ready = true;
  contextListener();
  assert.equal(loads, 1, 'ready context loads automatically');
  handlers.get('click')({ target: reload });
  assert.equal(loads, 2, 'ready manual reload works');
  ready = false;
  contextListener();
  assert.equal(loads, 2, 'sign out clears without reading');
  const beforeDispose = invalidations;
  cleanup();
  ready = true;
  contextListener();
  assert.equal(loads, 2, 'queued context callbacks cannot read after teardown');
  assert.equal(invalidations, beforeDispose, 'queued callbacks cannot invalidate a disposed runner');
});

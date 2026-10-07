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


test('mentee rendering exposes explicit share and revoke controls without changing response ownership', () => {
  const render = response => {
    const state = { status: 'ready', responseStatus: 'ready', shareStatus: 'idle', stepIndex: 1, writable: true, progress: null, error: null,
      responses: response ? { 'step-1': response } : {}, responseDrafts: { 'step-1': 'ready to share' },
      lesson: { steps: [{ id: 'step-0', type: 'scripture', content: { text: 'Scripture' } }, { id: 'step-1', type: 'understand', content: { text: 'Question' } }] } };
    const runner = { getIdentity: () => ({ pairId: 'pair', revisionId: 'revision' }), getState: () => state,
      subscribe() { return () => {}; }, load() {}, invalidate() {}, dispose() {} };
    const host = { innerHTML: '', querySelector() { return null; } };
    const page = { querySelector: () => host, addEventListener() {}, removeEventListener() {} };
    createLessonRunnerPage({ runner, onBack() {}, subscribeContext() { return () => {}; } }).mount({ querySelector: () => page });
    return host.innerHTML;
  };
  const privateHtml = render({ id: 'response-1', visibility: 'owner', audienceUserIds: [] });
  assert.match(privateHtml, /data-lesson-share-confirm="step-1"/);
  assert.match(privateHtml, /data-lesson-share="step-1"/);
  assert.doesNotMatch(privateHtml, /data-lesson-unshare/);

  const sharedHtml = render({ id: 'response-1', visibility: 'shared', audienceUserIds: ['mentor'] });
  assert.match(sharedHtml, /data-lesson-share-state="shared"/);
  assert.match(sharedHtml, /data-lesson-unshare="step-1"/);
  assert.doesNotMatch(sharedHtml, /data-lesson-share-confirm/);
});

test('mentor preview renders only an explicitly shared response as read-only content', () => {
  const state = { status: 'ready', responseStatus: 'ready', shareStatus: 'idle', stepIndex: 1, writable: false, progress: null, error: null,
    responses: { 'step-1': { id: 'response-1', visibility: 'shared', audienceUserIds: ['mentor'], response: { text: '<shared & safe>' } } }, responseDrafts: {},
    lesson: { steps: [{ id: 'step-0', type: 'scripture', content: { text: 'Scripture' } }, { id: 'step-1', type: 'understand', content: { text: 'Question' } }] } };
  const runner = { getIdentity: () => ({ pairId: 'pair', revisionId: 'revision' }), getState: () => state, subscribe() { return () => {}; }, load() {}, invalidate() {}, dispose() {} };
  const host = { innerHTML: '', querySelector() { return null; } };
  const page = { querySelector: () => host, addEventListener() {}, removeEventListener() {} };
  createLessonRunnerPage({ runner, onBack() {}, subscribeContext() { return () => {}; } }).mount({ querySelector: () => page });
  assert.match(host.innerHTML, /data-lesson-shared-response="step-1"/);
  assert.match(host.innerHTML, /&lt;shared &amp; safe&gt;/);
  assert.doesNotMatch(host.innerHTML, /<textarea/);
});

test('lesson response and step labels follow every supported V7 locale', () => {
  const previous = globalThis.localStorage;
  const values = new Map();
  globalThis.localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    key(index) { return [...values.keys()][index] ?? null; },
    get length() { return values.size; },
  };
  try {
    const expected = { en: ['Your private response', 'Understand'], tl: ['Pribado mong sagot', 'Unawain'], ceb: ['Pribado nimong tubag', 'Sabta'] };
    for (const [locale, labels] of Object.entries(expected)) {
      values.set('biblequest.v3.locale', JSON.stringify(locale));
      const state = { status: 'ready', responseStatus: 'ready', shareStatus: 'idle', stepIndex: 1, writable: true, progress: null, error: null,
        responses: {}, responseDrafts: { 'step-1': '' },
        lesson: { steps: [{ id: 'step-0', type: 'scripture', content: { text: 'Scripture' } }, { id: 'step-1', type: 'understand', content: { text: 'Question' } }] } };
      const runner = { getIdentity: () => ({ pairId: 'pair', revisionId: 'revision' }), getState: () => state, subscribe() { return () => {}; }, load() {}, invalidate() {}, dispose() {} };
      const host = { innerHTML: '', querySelector() { return null; } };
      const page = { querySelector: () => host, addEventListener() {}, removeEventListener() {} };
      createLessonRunnerPage({ runner, onBack() {}, subscribeContext() { return () => {}; } }).mount({ querySelector: () => page });
      assert.match(host.innerHTML, new RegExp(labels[0]));
      assert.match(host.innerHTML, new RegExp(`data-step-type="understand">${labels[1]}`));
    }
  } finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
});

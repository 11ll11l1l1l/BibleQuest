import test from 'node:test';
import assert from 'node:assert/strict';
import { curriculumAuthoringPublicationPage } from '../../src/features/curriculum-authoring/authoring-publication-page.js';

const request = suffix => ({
  trackId: `track-${suffix}`,
  moduleId: `module-${suffix}`,
  lessonId: `lesson-${suffix}`,
  lessonRevisionId: `revision-${suffix}`,
  expectedTrackRevisionId: `track-r-${suffix}`,
  expectedModuleRevisionId: `module-r-${suffix}`,
  expectedLessonRevisionId: `lesson-r-${suffix}`,
  libraryRevisionIds: [`library-${suffix}`],
});

const state = suffix => ({
  status: 'ready',
  tracks: [], modules: [], lessons: [], revisions: [], steps: [],
  selected: { trackId: null, moduleId: null, lessonId: null, revisionId: null },
  readiness: suffix ? { ready: true, stepCount: 7, blockers: [], request: request(suffix) } : null,
  error: null,
});

function fixture({ canPublish = false } = {}) {
  let current = state('one');
  const listeners = new Set();
  let loadCount = 0, invalidated = 0, disposed = 0;
  const controller = {
    getState: () => current,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    async load() { loadCount += 1; for (const fn of listeners) fn(current); },
    invalidate() { invalidated += 1; current = state(null); for (const fn of listeners) fn(current); },
    dispose() { disposed += 1; listeners.clear(); },
  };
  const handoffCalls = [];
  const handoff = {
    render(readiness) {
      const action = canPublish ? 'publish' : 'prepare';
      return `<button type="button" data-publication-handoff-action="${action}">${readiness?.ready ? action : 'not-ready'}</button>`;
    },
    async prepare() { handoffCalls.push('prepare'); },
    reset() { handoffCalls.push('reset'); },
    dispose() { handoffCalls.push('dispose'); },
    ...(canPublish ? { async publish() { handoffCalls.push('publish'); } } : {}),
  };
  let contextListener = null;
  const authoringHost = { innerHTML: '' };
  const publicationHost = { innerHTML: '' };
  const handlers = new Map();
  const root = {
    querySelector(selector) {
      if (selector === '[data-curriculum-authoring]') return authoringHost;
      if (selector === '[data-authoring-publication]') return publicationHost;
      return null;
    },
    addEventListener(name, fn) {
      if (!handlers.has(name)) handlers.set(name, new Set());
      handlers.get(name).add(fn);
    },
    removeEventListener(name, fn) { handlers.get(name)?.delete(fn); },
  };
  const emitClick = action => {
    const button = {
      disabled: false,
      closest(selector) { return selector === 'button[data-publication-handoff-action]' ? this : null; },
      getAttribute(name) { return name === 'data-publication-handoff-action' ? action : null; },
    };
    for (const fn of handlers.get('click') ?? []) fn({ target: button });
  };
  return {
    controller, handoff, handoffCalls, root, authoringHost, publicationHost, emitClick,
    setState(next) { current = next; for (const fn of listeners) fn(current); },
    get loadCount() { return loadCount; },
    get invalidated() { return invalidated; },
    get disposed() { return disposed; },
    subscribeContext(fn) { contextListener = fn; return () => { contextListener = null; }; },
    contextChange() { contextListener?.(); },
  };
}

const tick = () => new Promise(resolve => setImmediate(resolve));

test('composes the publication host without changing the shared route/navigation owner', async () => {
  const f = fixture();
  const page = curriculumAuthoringPublicationPage({ controller: f.controller, publicationHandoff: f.handoff, subscribeContext: f.subscribeContext });
  assert.match(page.html, /data-curriculum-authoring/);
  assert.match(page.html, /data-authoring-publication/);
  const cleanup = page.mount(f.root);
  await tick();
  assert.equal(f.loadCount, 1);
  assert.match(f.publicationHost.innerHTML, /data-publication-handoff-action="prepare"/);
  cleanup();
  assert.equal(f.disposed, 1);
  assert.ok(f.handoffCalls.includes('dispose'));
});

test('routes preparation and authoritative publish actions only to the injected handoff', async () => {
  let f = fixture();
  let page = curriculumAuthoringPublicationPage({ controller: f.controller, publicationHandoff: f.handoff });
  let cleanup = page.mount(f.root); await tick(); f.emitClick('prepare'); await tick();
  assert.equal(f.handoffCalls.filter(value => value === 'prepare').length, 1);
  cleanup();

  f = fixture({ canPublish: true });
  page = curriculumAuthoringPublicationPage({ controller: f.controller, publicationHandoff: f.handoff });
  cleanup = page.mount(f.root); await tick(); f.emitClick('publish'); await tick();
  assert.equal(f.handoffCalls.filter(value => value === 'publish').length, 1);
  cleanup();
});

test('changing the exact readiness request invalidates stale publication success state', async () => {
  const f = fixture({ canPublish: true });
  const page = curriculumAuthoringPublicationPage({ controller: f.controller, publicationHandoff: f.handoff });
  const cleanup = page.mount(f.root); await tick();
  const before = f.handoffCalls.filter(value => value === 'reset').length;
  f.setState(state('two'));
  assert.equal(f.handoffCalls.filter(value => value === 'reset').length, before + 1);
  f.setState(state('two'));
  assert.equal(f.handoffCalls.filter(value => value === 'reset').length, before + 1, 'same immutable request does not reset again');
  cleanup();
});

test('account or congregation invalidation clears the publication handoff through controller state', async () => {
  const f = fixture({ canPublish: true });
  const page = curriculumAuthoringPublicationPage({ controller: f.controller, publicationHandoff: f.handoff, subscribeContext: f.subscribeContext });
  const cleanup = page.mount(f.root); await tick();
  const before = f.handoffCalls.filter(value => value === 'reset').length;
  f.contextChange();
  assert.equal(f.invalidated, 1);
  assert.equal(f.handoffCalls.filter(value => value === 'reset').length, before + 1);
  cleanup();
});

test('fails closed when the composed publication host or handoff contract is missing', () => {
  const f = fixture();
  assert.throws(() => curriculumAuthoringPublicationPage({ controller: f.controller, publicationHandoff: {} }), /publication handoff/);
  const page = curriculumAuthoringPublicationPage({ controller: f.controller, publicationHandoff: f.handoff });
  const root = { ...f.root, querySelector(selector) { return selector === '[data-authoring-publication]' ? null : f.root.querySelector(selector); } };
  assert.throws(() => page.mount(root), /publication host/);
});


test('publication waits for authoring saves, loads and readiness checks to finish', async () => {
  const f = fixture({ canPublish: true });
  const page = curriculumAuthoringPublicationPage({ controller: f.controller, publicationHandoff: f.handoff });
  const cleanup = page.mount(f.root); await tick();
  for (const status of ['saving', 'loading', 'checking', 'error', 'idle']) {
    f.setState({ ...state('one'), status });
    assert.match(f.publicationHost.innerHTML, /not-ready/);
    f.emitClick('publish'); await tick();
    assert.equal(f.handoffCalls.filter(value => value === 'publish').length, 0);
  }
  f.setState(state('one')); f.emitClick('publish'); await tick();
  assert.equal(f.handoffCalls.filter(value => value === 'publish').length, 1);
  cleanup();
});

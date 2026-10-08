import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createLessonRunnerPage } from '../../src/features/lesson-runner/page.js';

function renderPage(state) {
  const host = { innerHTML: '', querySelector() { return null; } };
  const page = { querySelector() { return host; }, addEventListener() {}, removeEventListener() {} };
  const runner = {
    getState: () => state,
    subscribe() { return () => {}; },
    load() {},
    invalidate() {},
    dispose() {},
  };
  const view = createLessonRunnerPage({ runner, onBack() {}, subscribeContext() { return () => {}; } });
  const dispose = view.mount({ querySelector: () => page });
  return { html: host.innerHTML, pageHtml: view.html, dispose };
}

const STEP_TYPES = ['scripture', 'understand', 'discuss', 'reflect', 'apply', 'pray', 'action'];
const STEPS = STEP_TYPES.map((type, index) => ({
  id: 'step-' + index,
  type,
  content: { text: 'Content ' + index },
  scriptureRefs: [],
}));

test('ONE 2 ONE reading exposes semantic progress and a single primary next action', () => {
  const { html, pageHtml, dispose } = renderPage({
    status: 'ready', lesson: { steps: STEPS }, stepIndex: 2,
    writable: true, progress: { status: 'active' }, responses: {}, responseDrafts: {},
  });
  assert.match(pageHtml, /class="bq-panel bq-one2one-lesson"/);
  assert.match(html, /<article class="bq-lesson-reading">/);
  assert.match(html, /<progress class="bq-lesson-progress"[^>]*max="7" value="3"/);
  assert.match(html, /data-step-type="discuss"/);
  assert.match(html, /class="bq-primary-button" data-lesson-next/);
  assert.match(html, /class="bq-secondary-button" data-lesson-previous/);
  assert.equal((html.match(/class="bq-primary-button"/g) || []).length, 1);
  dispose();
});

test('ONE 2 ONE completion keeps only the finish action primary and privacy consent optional', () => {
  const { html, dispose } = renderPage({
    status: 'ready', lesson: { steps: STEPS }, stepIndex: 6,
    writable: true, progress: { status: 'active' }, responses: {}, responseDrafts: { 'step-6': 'A private thought' },
  });
  assert.match(html, /max="7" value="7"/);
  assert.match(html, /data-lesson-complete/);
  assert.doesNotMatch(html, /data-lesson-next/);
  assert.match(html, /data-lesson-share-state="private"/);
  assert.match(html, /data-lesson-share-confirm="step-6"/);
  assert.doesNotMatch(html, /data-lesson-unshare/);
  assert.equal((html.match(/class="bq-primary-button"/g) || []).length, 1);
  dispose();
});

test('ONE 2 ONE idle/recoverable failure uses a labeled retry instead of an empty pane', () => {
  const { html, dispose } = renderPage({ status: 'error', lesson: null, error: 'Could not load' });
  assert.match(html, /data-lesson-reload/);
  assert.match(html, /role="status"/);
  assert.match(html, /Could not load/);
  dispose();
});

test('only actual lesson step changes request a short header arrival transition', () => {
  let state = {
    status: 'ready', lesson: { steps: STEPS }, stepIndex: 0,
    writable: true, progress: { status: 'active' }, responses: {}, responseDrafts: {},
  };
  let render;
  const host = { innerHTML: '', querySelector() { return null; } };
  const page = { querySelector() { return host; }, addEventListener() {}, removeEventListener() {} };
  const runner = {
    getState: () => state,
    subscribe(fn) { render = fn; return () => {}; },
    load() {}, invalidate() {}, dispose() {},
  };
  const view = createLessonRunnerPage({ runner, onBack() {}, subscribeContext() { return () => {}; } });
  const dispose = view.mount({ querySelector() { return page; } });
  assert.match(host.innerHTML, /<header class="bq-lesson-header" data-step-arriving>/);
  render(state);
  assert.doesNotMatch(host.innerHTML, /data-step-arriving/, 'Saving a response cannot replay an entry transition.');
  state = { ...state, stepIndex: 1 };
  render(state);
  assert.match(host.innerHTML, /data-step-arriving/, 'New lesson stage announces a short heading transition.');
  render(state);
  assert.doesNotMatch(host.innerHTML, /data-step-arriving/);
  state = { ...state, status: 'idle', lesson: null };
  render(state);
  assert.doesNotMatch(host.innerHTML, /data-step-arriving/);
  state = { ...state, status: 'ready', lesson: { steps: STEPS } };
  render(state);
  assert.match(host.innerHTML, /data-step-arriving/, 'Fresh authorized lesson load may animate its heading once.');
  dispose();
});

test('Lane C motion excludes long Scripture/response text and disables animation when motion is reduced', () => {
  const css = readFileSync(new URL('../../src/ui/v7-one-to-one-lesson.css', import.meta.url), 'utf8');
  assert.match(css, /--bq-motion-duration-standard/);
  assert.match(css, /--bq-motion-duration-micro/);
  assert.match(css, /\\.bq-lesson-header\\[data-step-arriving\\]/);
  assert.match(css, /@media \\(prefers-reduced-motion: reduce\\)/);
  const keyframe = css.slice(css.indexOf('@keyframes bq-one2one-step-arrive'), css.indexOf('@keyframes bq-one2one-step-arrive') + 170);
  assert.match(keyframe, /opacity/);
  assert.match(keyframe, /transform/);
  const motion = css.slice(css.indexOf('@keyframes bq-one2one-step-arrive'));
  assert.doesNotMatch(motion, /\\.bq-lesson-copy|\\.bq-lesson-response-editor/, 'Reading and response fields must never animate.');
});

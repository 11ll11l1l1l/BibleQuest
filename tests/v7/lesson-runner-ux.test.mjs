import test from 'node:test';
import assert from 'node:assert/strict';
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

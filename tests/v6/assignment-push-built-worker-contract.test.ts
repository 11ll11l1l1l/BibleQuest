import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const gate = readFileSync(new URL('./pwa-built-artifact-browser.mjs', import.meta.url), 'utf8');

test('built PWA gate retains assignment notification service-worker evidence', () => {
  assert.match(gate, /serviceWorker\.ready/);
  assert.match(gate, /offline-shell-sw\.js/);
  assert.match(gate, /dispatchPushThroughInstalledWorker/);
  assert.match(gate, /title: 'New assignment'/);
  assert.match(gate, /title: 'Assignment due soon'/);
  assert.match(gate, /type: 'assignments'/);
  assert.match(gate, /assignments deep link/);
});

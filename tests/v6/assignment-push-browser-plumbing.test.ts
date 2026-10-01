import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const browserGate = readFileSync(new URL('./pwa-built-artifact-browser.mjs', import.meta.url), 'utf8');

test('built PWA gate exercises assigned and due payloads through installed worker', () => {
  assert.match(browserGate, /dispatchPushThroughInstalledWorker/);
  assert.match(browserGate, /title: 'New assignment'/);
  assert.match(browserGate, /title: 'Assignment due soon'/);
  assert.match(browserGate, /url: '\\/#\\/assignments'/);
  assert.match(browserGate, /data\\?\\.type === 'assignments'/);
});

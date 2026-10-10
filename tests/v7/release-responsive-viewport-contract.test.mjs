import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('V7 release accessibility evidence includes the tablet breakpoint used by motion QA', async () => {
  const source = await readFile(new URL('./release-responsive-accessibility-browser.mjs', import.meta.url), 'utf8');
  for (const width of [320, 390, 430, 800]) {
    assert.match(source, new RegExp('\\{ width: ' + width + ', height: \\d+ \\}'),
      'Missing exact release viewport ' + width);
  }
  assert.match(source, /responsive-320-390-430-800-tablet/);
  assert.match(source, /200-percent-text-resize-without-horizontal-overflow/);
  assert.match(source, /visible-keyboard-focus/);
  assert.match(source, /strong-contrast-primary-text/);
  assert.match(source, /reduced-motion-state/);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [home, reader, assignments, css, index] = await Promise.all([
  readFile(new URL('../../src/features/home/index.js', import.meta.url), 'utf8'),
  readFile(new URL('../../src/features/reader/index.js', import.meta.url), 'utf8'),
  readFile(new URL('../../src/features/assignments/index.js', import.meta.url), 'utf8'),
  readFile(new URL('../../src/ui/v6-core-experience.css', import.meta.url), 'utf8'),
  readFile(new URL('../../index.html', import.meta.url), 'utf8')
]);

test('Phase 2 Home leads with one journey and compact Today actions', () => {
  assert.match(home, /CONTINUE YOUR JOURNEY/);
  assert.match(home, /bq-home-today-row/);
  assert.match(home, /data-open-home-next-event/);
});

test('Phase 2 Reader keeps Scripture ahead of progressively disclosed controls', () => {
  assert.ok(reader.indexOf('${scripture}<aside class="bq-reader-controls"') < reader.indexOf('bq-reader-settings'));
  assert.match(reader, /<details class="bq-reader-audio__more">/);
  assert.match(reader, /data-reader-audio-follow/);
  assert.match(reader, /data-reader-offline-package/);
});

test('Phase 2 Assignments provide To do and Completed views without changing service calls', () => {
  assert.match(assignments, /data-assignment-filter="todo"/);
  assert.match(assignments, /data-assignment-filter="completed"/);
  assert.match(assignments, /assignments\.complete\(id,submission,requirements\)/);
  assert.match(assignments, /ministryRoles\.has\(state\.role\)/);
});

test('Phase 2 CSS is last and protects narrow mobile layouts', () => {
  assert.ok(index.indexOf('v6-core-experience.css') > index.indexOf('v6-modern-foundation.css'));
  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /@media \(max-width: 340px\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
});

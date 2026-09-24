import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  japaneseFuriganaControl,
  japaneseFuriganaRecoveryStatus,
} from '../../src/features/reader/furigana.js';

const readerSource = fs.readFileSync(new URL('../../src/features/reader/index.js', import.meta.url), 'utf8');

test('Japanese furigana control stays explicit and accessible', () => {
  const html = japaneseFuriganaControl({ mode: 'all' });
  assert.match(html, /data-reader-furigana/);
  assert.match(html, /aria-label="Japanese furigana mode"/);
  assert.match(html, /value="all" selected/);
});

test('tokenizer fallback exposes a retry control without replacing Scripture', () => {
  const html = japaneseFuriganaRecoveryStatus({ fallback: true });
  assert.match(html, /data-jp-furigana-fallback/);
  assert.match(html, /data-reader-furigana-retry/);
  assert.match(html, /聖書本文は保持したまま/);
  assert.doesNotMatch(html, /BSB|別の訳/);
});

test('retrying state is announced and successful recovery clears the status', () => {
  assert.match(
    japaneseFuriganaRecoveryStatus({ retrying: true }),
    /data-jp-furigana-retrying/,
  );
  assert.equal(japaneseFuriganaRecoveryStatus({ fallback: false, retrying: false }), '');
});

test('live Reader wires the fallback status and retries in place on the same Japanese chapter', () => {
  assert.match(readerSource, /data-jp-furigana-status aria-live="polite"/);
  assert.match(readerSource, /data-reader-furigana-retry/);
  assert.match(
    readerSource,
    /applyFurigana\(currentChapter, true, \{ retrying: true \}\)/,
  );
  assert.match(readerSource, /reader\.getState\(\)\.translation === 'jko'/);
});

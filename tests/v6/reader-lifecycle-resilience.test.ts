import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readerSource = readFileSync(new URL('../../src/features/reader/index.js', import.meta.url), 'utf8');

test('Reader teardown invalidates chapter and furigana async work before detaching listeners', () => {
  const cleanup = readerSource.slice(readerSource.lastIndexOf('return () => {'));

  assert.ok(cleanup, 'Reader mount must expose an explicit cleanup boundary');
  const operationInvalidation = cleanup.indexOf('operation++');
  const furiganaInvalidation = cleanup.indexOf('furiganaPass++');
  const listenerRemoval = cleanup.indexOf("host.removeEventListener('change', onChange)");

  assert.ok(operationInvalidation >= 0, 'cleanup must invalidate pending Reader operations');
  assert.ok(furiganaInvalidation >= 0, 'cleanup must invalidate pending furigana passes');
  assert.ok(listenerRemoval >= 0, 'cleanup must detach Reader listeners');
  assert.ok(operationInvalidation < listenerRemoval, 'operation invalidation must happen before listener teardown');
  assert.ok(furiganaInvalidation < listenerRemoval, 'furigana invalidation must happen before listener teardown');
});

test('Reader teardown cancels an active managed offline download without inventing completion', () => {
  assert.match(
    readerSource,
    /if \(activeOfflineDownload && offlinePackages\) offlinePackages\.cancel\(activeOfflineDownload\.translationId, activeOfflineDownload\.bookCode\);/
  );
  assert.match(readerSource, /activeOfflineDownload = null;/);
});

test('Reader teardown closes transient dialogs and removes every listener installed by mount', () => {
  for (const event of ['change', 'click', 'submit']) {
    assert.match(readerSource, new RegExp(`host\\.addEventListener\\('${event}', on[A-Z][A-Za-z]+\\)`));
    assert.match(readerSource, new RegExp(`host\\.removeEventListener\\('${event}', on[A-Z][A-Za-z]+\\)`));
  }

  assert.match(readerSource, /host\.querySelector\('\[data-verse-dialog\]'\)\?\.close\(\)/);
  assert.match(readerSource, /host\.querySelector\('\[data-context-dialog\]'\)\?\.close\(\)/);
});

test('late furigana rendering is rejected after pass invalidation or translation change', () => {
  assert.match(readerSource, /const pass=\+\+furiganaPass/);
  assert.match(readerSource, /if\(pass!==furiganaPass\|\|reader\.getState\(\)\.translation!=='jko'\) return/);
});

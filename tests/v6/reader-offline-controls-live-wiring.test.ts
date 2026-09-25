import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const bootstrap = await readFile(new URL('../../src/app/bootstrap.js', import.meta.url), 'utf8');
const readerPage = await readFile(new URL('../../src/features/reader/index.js', import.meta.url), 'utf8');

test('live Reader receives the V6 managed offline package controller', () => {
  assert.match(bootstrap, /createBrowserScripturePackageController/);
  assert.match(bootstrap, /const offlineScripturePackages=createBrowserScripturePackageController\(\)/);
  assert.match(
    bootstrap,
    /readerPage\(\{reader,vocabulary,furigana,offlinePackages:offlineScripturePackages\}\)/,
  );
});

test('Reader exposes managed download progress, cancel, retry path, remove and storage usage', () => {
  for (const hook of [
    'data-reader-offline-package',
    'data-reader-offline-download',
    'data-reader-offline-cancel',
    'data-reader-offline-remove',
    'data-reader-offline-progress-bar',
    'data-reader-offline-progress-text',
  ]) {
    assert.ok(readerPage.includes(hook), `Reader missing managed offline hook: ${hook}`);
  }
  assert.match(readerPage, /Storage:/);
  assert.match(readerPage, /offlinePackages\.install/);
  assert.match(readerPage, /offlinePackages\.cancel/);
  assert.match(readerPage, /offlinePackages\.remove/);
  assert.match(readerPage, /Offline download failed\. Retry when connected\./);
});

test('Reader route teardown cancels active managed transfer', () => {
  assert.match(
    readerPage,
    /if \(activeOfflineDownload && offlinePackages\) offlinePackages\.cancel\(activeOfflineDownload\.translationId, activeOfflineDownload\.bookCode\)/,
  );
  assert.match(readerPage, /activeOfflineDownload = null/);
});

test('managed controls preserve existing Reader advanced surfaces', () => {
  for (const contract of [
    'data-reader-quest-complete',
    'data-reader-furigana-retry',
    'data-reader-context',
    'data-peek-context',
    'data-reader-search',
    'presentReaderChapter',
  ]) {
    assert.ok(readerPage.includes(contract), `Reader regression lost existing contract: ${contract}`);
  }
});

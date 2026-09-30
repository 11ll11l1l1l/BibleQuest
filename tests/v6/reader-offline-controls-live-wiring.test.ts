import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const bootstrap = await readFile(new URL('../../src/app/bootstrap.js', import.meta.url), 'utf8');
const readerBoot = await readFile(new URL('../../src/app/reader-v6-page.js', import.meta.url), 'utf8');
const readerPage = await readFile(new URL('../../src/features/reader/index.js', import.meta.url), 'utf8');

test('live Reader receives the V6 managed offline package controller', () => {
  assert.match(readerBoot, /createBrowserScripturePackageController/);
  assert.match(readerBoot, /import\('\.\.\/v6\/reader\/browser-packages\.ts'\)/);
  assert.match(readerBoot, /createBrowserScripturePackageController\(\{ books: args\.books \}\)/);
  assert.match(
    readerBoot,
    /pageModule\.readerPage\(\{\s*\.\.\.args,\s*offlinePackages: packageModule\.createBrowserScripturePackageController\(\{ books: args\.books \}\),\s*audio: readerAudioProvider/,
  );
  assert.doesNotMatch(
    bootstrap,
    /const offlineScripturePackages\s*=\s*createBrowserScripturePackageController\(\)/,
    'offline controller creation must stay inside the lazy Reader route after the runtime split',
  );
});

test('Reader routes offline text search only through verified installed Scripture packages', () => {
  assert.match(readerPage, /globalThis\.navigator\?\.onLine === false/);
  assert.match(readerPage, /offlinePackages\.searchOfflineText\(reader\.getState\(\)\.translation, query, 30\)/);
  assert.match(readerBoot, /createBrowserScripturePackageController\(\{ books: args\.books \}\)/);
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
  assert.match(readerPage, /Update offline book/);
  assert.match(readerPage, /data-offline-update-available/);
  assert.match(readerPage, /offlinePackages\.listInstalled/);
  assert.match(
    readerPage,
    /offlinePackageHtml\(snapshot, Boolean\(activeOfflineKey\(latest\)\), offlineInventory, translationSnapshot, activeOfflineTranslation\)/,
  );
  assert.match(readerPage, /data-reader-offline-remove-package/);
  assert.match(readerPage, /Downloaded Bible books/);
  for (const hook of [
    'data-reader-translation-download',
    'data-reader-translation-cancel',
    'data-reader-translation-remove',
    'data-reader-translation-progress',
    'data-reader-translation-progress-text',
  ]) assert.ok(readerPage.includes(hook), `Reader missing full translation hook: ${hook}`);
  assert.match(readerPage, /offlinePackages\.installTranslation/);
  assert.match(readerPage, /offlinePackages\.cancelTranslation/);
  assert.match(readerPage, /offlinePackages\.removeTranslation/);
});

test('Reader route teardown cancels active managed transfer', () => {
  assert.match(
    readerPage,
    /if \(activeOfflineDownload && offlinePackages\) offlinePackages\.cancel\(activeOfflineDownload\.translationId, activeOfflineDownload\.bookCode\)/,
  );
  assert.match(readerPage, /activeOfflineDownload = null/);
  assert.match(readerPage, /if \(activeOfflineTranslation && offlinePackages\) offlinePackages\.cancelTranslation\(activeOfflineTranslation\.translationId\)/);
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


test('all Reader offline installs stay behind explicit user actions and browser-local removable storage', async () => {
  const [browserPackages, audioStorage, packageManager, audioPolicy] = await Promise.all([
    readFile(new URL('../../src/v6/reader/browser-packages.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/v6/reader/audio-package-storage.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/v6/reader/package-manager.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/v6/reader/audio-policy.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(readerPage, /target\.closest\('\[data-reader-offline-download\]'\)[\s\S]{0,900}offlinePackages\.install\(state\.translation, state\.book/);
  assert.match(readerPage, /target\.closest\('\[data-reader-translation-download\]'\)[\s\S]{0,900}offlinePackages\.installTranslation\(translationId/);
  assert.match(readerPage, /target\.closest\('\[data-reader-audio-download\]'\)[\s\S]{0,900}audio\.installChapter\(state\.book, state\.chapter/);

  assert.match(browserPackages, /const cacheStorage = globalThis\.caches|cacheStorage = globalThis\.caches/);
  assert.match(browserPackages, /removeInstalled[\s\S]{0,500}payloadCache\.delete/);
  assert.match(browserPackages, /metadataCache\.delete/);
  assert.doesNotMatch(browserPackages, /supabase/i);

  assert.match(audioStorage, /const cacheStorage = input\.cacheStorage \?\? globalThis\.caches/);
  assert.match(audioStorage, /removeInstalled[\s\S]{0,200}deleteBoth/);
  assert.doesNotMatch(audioStorage, /supabase/i);

  assert.match(packageManager, /assertScriptureDownloadAllowed\(manifest\)/);
  assert.match(audioPolicy, /permissions\?\.offlineCopy !== 'allowed'/);
});

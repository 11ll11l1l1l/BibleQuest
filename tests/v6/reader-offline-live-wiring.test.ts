import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const bootstrap = await readFile(new URL('../../src/app/bootstrap.js', import.meta.url), 'utf8');
const readerPage = await readFile(new URL('../../src/features/reader/index.js', import.meta.url), 'utf8');
const viteConfig = await readFile(new URL('../../vite.config.mjs', import.meta.url), 'utf8');
const buildEvidence = await readFile(new URL('../../scripts/v6-build-evidence.mjs', import.meta.url), 'utf8');
const browserGate = await readFile(new URL('./built-artifact-browser.mjs', import.meta.url), 'utf8');

test('live Reader receives the V6 managed offline package controller', () => {
  assert.match(bootstrap, /createBrowserScripturePackageController/);
  assert.match(bootstrap, /const offlineScripturePackages=createBrowserScripturePackageController\(\)/);
  assert.match(
    bootstrap,
    /readerPage\(\{reader,vocabulary,furigana,offlinePackages:offlineScripturePackages\}\)/,
  );
});

test('Reader exposes download progress, cancel, remove and storage controls', () => {
  for (const hook of [
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
});

test('built artifact owns immutable Scripture manifests and verifies them', () => {
  assert.match(viteConfig, /generateScripturePackageManifests/);
  assert.match(buildEvidence, /v6-scripture-manifests/);
  assert.match(buildEvidence, /sha256 mismatch/);
  assert.match(buildEvidence, /byte-length mismatch/);
  assert.match(buildEvidence, /expected 66 book packages/);
});

test('Chromium gate proves managed download, offline reload/navigation and reclaim', () => {
  assert.match(browserGate, /V6 managed offline Reader/);
  assert.match(browserGate, /setOffline\(true\)/);
  assert.match(browserGate, /Available offline/);
  assert.match(browserGate, /John 2/);
  assert.match(browserGate, /setOffline\(false\)/);
  assert.match(browserGate, /remove did not reclaim managed storage/);
});

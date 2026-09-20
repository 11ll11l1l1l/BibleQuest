import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildScripturePackageManifest,
  SCRIPTURE_PACKAGE_SOURCES,
} from '../../scripts/v6-generate-scripture-manifests.mjs';
import type { ScriptureTranslationManifest } from '../../src/v6/reader/content-manifest.ts';
import {
  createBrowserScripturePackageController,
} from '../../src/v6/reader/browser-packages.ts';
import type {
  InstalledScripturePackage,
  ScripturePackageRepository,
  ScripturePackageTransport,
} from '../../src/v6/reader/package-manager.ts';

const abcSha = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

test('source-derived downloadable manifests cover all 66 books with immutable metadata', () => {
  assert.deepEqual(SCRIPTURE_PACKAGE_SOURCES.map(source => source.translationId), ['bsb', 'tl', 'cebocb']);
  for (const source of SCRIPTURE_PACKAGE_SOURCES) {
    const manifest = buildScripturePackageManifest(process.cwd(), source);
    assert.equal(manifest.translationId, source.translationId);
    assert.equal(manifest.delivery, 'downloadable');
    assert.equal(manifest.license.redistribution, 'allowed');
    assert.equal(manifest.books.length, 66);
    assert.match(manifest.contentVersion, /^sha256-[a-f0-9]{20}$/);
    for (const book of manifest.books) {
      assert.match(book.sha256, /^[a-f0-9]{64}$/);
      assert.ok(book.bytes > 0);
      assert.match(book.url, /^data\/packs\//);
    }
  }
});

function manifest(): ScriptureTranslationManifest {
  return {
    schemaVersion: 1,
    translationId: 'bsb',
    label: 'English · BSB',
    contentVersion: 'sha256-test',
    delivery: 'downloadable',
    license: {
      source: 'Berean Standard Bible',
      license: 'Public-domain / CC0 browser source',
      attribution: 'Test',
      redistribution: 'allowed',
    },
    books: [{ bookCode: 'JHN', url: 'data/packs/bible/JHN.json', sha256: abcSha, bytes: 3 }],
  };
}

function repository() {
  let installed: InstalledScripturePackage | null = null;
  const value: ScripturePackageRepository = {
    async readInstalled(translationId, bookCode) {
      return installed?.translationId === translationId && installed.bookCode === bookCode ? installed : null;
    },
    async replaceInstalled(record) { installed = record; },
    async removeInstalled(translationId, bookCode) {
      if (installed?.translationId === translationId && installed.bookCode === bookCode) installed = null;
    },
    async usage() { return { bytes: installed?.bytes ?? 0, packages: installed ? 1 : 0 }; },
  };
  return { value, installed: () => installed };
}

test('browser controller exposes install, usage and removal without weakening licensing policy', async () => {
  const repo = repository();
  const transport: ScripturePackageTransport = {
    async download(_url, options) {
      options.onProgress?.(3, 3);
      return new TextEncoder().encode('abc').buffer;
    },
  };
  let manifestRequests = 0;
  const fetcher = async () => {
    manifestRequests += 1;
    return new Response(JSON.stringify(manifest()), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  const controller = createBrowserScripturePackageController({
    repository: repo.value,
    transport,
    fetcher: fetcher as typeof fetch,
  });

  const before = await controller.snapshot('bsb', 'JHN');
  assert.equal(before.downloadable, true);
  assert.equal(before.installed, null);
  assert.equal(before.packageBytes, 3);

  const result = await controller.install('bsb', 'JHN');
  assert.equal(result.status, 'installed');
  assert.equal(repo.installed()?.bookCode, 'JHN');

  const after = await controller.snapshot('bsb', 'JHN');
  assert.equal(after.installed?.sha256, abcSha);
  assert.deepEqual(after.usage, { bytes: 3, packages: 1 });

  const external = await controller.snapshot('nlt', 'JHN');
  assert.equal(external.downloadable, false);
  assert.match(external.reason, /licensed external reader/i);

  await controller.remove('bsb', 'JHN');
  assert.equal(repo.installed(), null);
  assert.equal(manifestRequests, 1, 'manifest should be cached after the first successful load');
});

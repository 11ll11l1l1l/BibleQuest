import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildScripturePackageManifest,
  SCRIPTURE_PACKAGE_SOURCES,
} from '../../scripts/v6-generate-scripture-manifests.mjs';
import type { ScriptureTranslationManifest } from '../../src/v6/reader/content-manifest.ts';
import {
  createBrowserScripturePackageController,
  createBrowserScripturePackageRepository,
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
    const generated = buildScripturePackageManifest(process.cwd(), source);
    assert.equal(generated.translationId, source.translationId);
    assert.equal(generated.delivery, 'downloadable');
    assert.equal(generated.license.redistribution, 'allowed');
    assert.equal(generated.books.length, 66);
    assert.match(generated.contentVersion, /^sha256-[a-f0-9]{20}$/);
    for (const book of generated.books) {
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
      license: 'Test redistribution',
      attribution: 'Test',
      redistribution: 'allowed',
    },
    books: [{ bookCode: 'JHN', url: 'data/packs/bible/JHN.json', sha256: abcSha, bytes: 3 }],
  };
}

function memoryRepository() {
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

function manifestFetcher({failFirst = false} = {}) {
  let requests = 0;
  return {
    requests: () => requests,
    fetcher: (async () => {
      requests += 1;
      if (failFirst && requests === 1) return new Response('nope', { status: 503 });
      return new Response(JSON.stringify(manifest()), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch,
  };
}


class MemoryCache {
  readonly entries = new Map<string, Response>();

  key(input: RequestInfo | URL): string {
    if (input instanceof Request) return input.url;
    if (input instanceof URL) return input.href;
    return String(input);
  }

  async match(input: RequestInfo | URL): Promise<Response | undefined> {
    return this.entries.get(this.key(input))?.clone();
  }

  async put(input: RequestInfo | URL, response: Response): Promise<void> {
    this.entries.set(this.key(input), response.clone());
  }

  async delete(input: RequestInfo | URL): Promise<boolean> {
    return this.entries.delete(this.key(input));
  }

  async keys(): Promise<Request[]> {
    return [...this.entries.keys()].map(url => new Request(url));
  }
}

function memoryCacheStorage() {
  const caches = new Map<string, MemoryCache>();
  const storage = {
    async open(name: string) {
      if (!caches.has(name)) caches.set(name, new MemoryCache());
      return caches.get(name)!;
    },
  } as unknown as CacheStorage;
  return { storage, cache: (name: string) => caches.get(name) };
}

test('browser repository evicts cached payload whose bytes no longer match verified metadata', async () => {
  const memory = memoryCacheStorage();
  const locationRef = { href: 'https://biblequest.test/#/reader' } as Location;
  const repository = createBrowserScripturePackageRepository({
    cacheStorage: memory.storage,
    ResponseCtor: Response,
    locationRef,
  });

  const record: InstalledScripturePackage = {
    key: `bsb:sha256-test:JHN:${abcSha}`,
    translationId: 'bsb',
    contentVersion: 'sha256-test',
    bookCode: 'JHN',
    sha256: abcSha,
    bytes: 3,
    installedAt: '2026-09-27T08:00:00.000Z',
  };

  await repository.replaceInstalled(record, new TextEncoder().encode('abc').buffer);
  assert.equal((await repository.readInstalled('bsb', 'JHN'))?.sha256, abcSha);

  const payloadCache = memory.cache('biblequest-v3-opened-bible-packs-v1');
  assert.ok(payloadCache);
  await payloadCache.put(
    'https://biblequest.test/data/packs/bible/JHN.json',
    new Response('abd', { headers: { 'content-type': 'application/json' } }),
  );

  assert.equal(await repository.readInstalled('bsb', 'JHN'), null);
  assert.equal(await payloadCache.match('https://biblequest.test/data/packs/bible/JHN.json'), undefined);
  const metadataCache = memory.cache('biblequest-v6-scripture-package-metadata-v1');
  assert.equal(
    await metadataCache?.match('https://biblequest.test/__bq_v6_scripture_packages__/bsb/JHN.json'),
    undefined,
  );
});

test('browser repository evicts malformed installed metadata and orphaned payload together', async () => {
  const memory = memoryCacheStorage();
  const locationRef = { href: 'https://biblequest.test/#/reader' } as Location;
  const repository = createBrowserScripturePackageRepository({
    cacheStorage: memory.storage,
    ResponseCtor: Response,
    locationRef,
  });

  const payloadCache = await memory.storage.open('biblequest-v3-opened-bible-packs-v1');
  const metadataCache = await memory.storage.open('biblequest-v6-scripture-package-metadata-v1');
  await payloadCache.put(
    'https://biblequest.test/data/packs/bible/JHN.json',
    new Response('abc'),
  );
  await metadataCache.put(
    'https://biblequest.test/__bq_v6_scripture_packages__/bsb/JHN.json',
    new Response(JSON.stringify({
      key: 'broken',
      translationId: 'bsb',
      contentVersion: 'broken',
      bookCode: 'JHN',
      sha256: 'not-a-digest',
      bytes: 3,
      installedAt: '2026-09-27T08:00:00.000Z',
    })),
  );

  assert.equal(await repository.readInstalled('bsb', 'JHN'), null);
  assert.equal(await payloadCache.match('https://biblequest.test/data/packs/bible/JHN.json'), undefined);
  assert.equal(
    await metadataCache.match('https://biblequest.test/__bq_v6_scripture_packages__/bsb/JHN.json'),
    undefined,
  );
});

test('browser package controller installs verified books, reports storage and removes them', async () => {
  const repo = memoryRepository();
  const remote = manifestFetcher();
  const progress: string[] = [];
  const transport: ScripturePackageTransport = {
    async download(_url, options) {
      options.onProgress?.(1, 3);
      options.onProgress?.(3, 3);
      return new TextEncoder().encode('abc').buffer;
    },
  };
  const controller = createBrowserScripturePackageController({
    repository: repo.value,
    transport,
    fetcher: remote.fetcher,
  });

  const before = await controller.snapshot('bsb', 'JHN');
  assert.equal(before.downloadable, true);
  assert.equal(before.installed, null);
  assert.equal(before.packageBytes, 3);
  assert.deepEqual(before.usage, { bytes: 0, packages: 0 });

  const result = await controller.install('bsb', 'JHN', event => progress.push(event.phase));
  assert.equal(result.status, 'installed');
  assert.equal(repo.installed()?.sha256, abcSha);
  assert.ok(progress.includes('downloading'));
  assert.ok(progress.includes('verifying'));
  assert.ok(progress.includes('storing'));

  const after = await controller.snapshot('bsb', 'JHN');
  assert.equal(after.installed?.bytes, 3);
  assert.deepEqual(after.usage, { bytes: 3, packages: 1 });

  await controller.remove('bsb', 'JHN');
  assert.equal(repo.installed(), null);
  assert.equal(remote.requests(), 1, 'successful manifest loads should be cached');
});

test('external and unapproved translations fail closed before package download', async () => {
  const repo = memoryRepository();
  let downloads = 0;
  const controller = createBrowserScripturePackageController({
    repository: repo.value,
    transport: { async download() { downloads += 1; return new ArrayBuffer(0); } },
    fetcher: manifestFetcher().fetcher,
  });

  const nlt = await controller.snapshot('nlt', 'JHN');
  assert.equal(nlt.downloadable, false);
  assert.match(nlt.reason, /licensed external reader/i);
  assert.equal(downloads, 0);
});

test('failed manifest load is retryable instead of poisoning the manifest cache', async () => {
  const repo = memoryRepository();
  const remote = manifestFetcher({ failFirst: true });
  const controller = createBrowserScripturePackageController({
    repository: repo.value,
    transport: { async download() { return new TextEncoder().encode('abc').buffer; } },
    fetcher: remote.fetcher,
  });

  await assert.rejects(() => controller.install('bsb', 'JHN'), /manifest is unavailable/i);
  const retried = await controller.install('bsb', 'JHN');
  assert.equal(retried.status, 'installed');
  assert.equal(remote.requests(), 2);
});

test('active package download can be cancelled through the controller', async () => {
  const repo = memoryRepository();
  const remote = manifestFetcher();
  let started = false;
  const transport: ScripturePackageTransport = {
    download(_url, { signal }) {
      started = true;
      return new Promise<ArrayBuffer>((_resolve, reject) => {
        const fail = () => {
          const error = new Error('cancelled');
          error.name = 'AbortError';
          reject(error);
        };
        if (signal.aborted) fail();
        else signal.addEventListener('abort', fail, { once: true });
      });
    },
  };
  const controller = createBrowserScripturePackageController({
    repository: repo.value,
    transport,
    fetcher: remote.fetcher,
  });

  const pending = controller.install('bsb', 'JHN');
  while (!started) await Promise.resolve();
  assert.equal(controller.cancel('bsb', 'JHN'), true);
  await assert.rejects(pending, error => (error as Error).name === 'AbortError');
  assert.equal(controller.cancel('bsb', 'JHN'), false);
  assert.equal(repo.installed(), null);
});

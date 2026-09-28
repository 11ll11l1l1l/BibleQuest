import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import {
  buildScripturePackageManifest,
  SCRIPTURE_PACKAGE_SOURCES,
} from '../../scripts/v6-generate-scripture-manifests.mjs';
import type { ScriptureTranslationManifest } from '../../src/v6/reader/content-manifest.ts';
import { CANONICAL_BIBLE_BOOK_CODES } from '../../src/v6/reader/full-translation-offline.ts';
import { createBibleDataService, createOpenedPackStore } from '../../src/core/bible.js';
import {
  createBrowserScripturePackageRepository,
  createBrowserScripturePackageController,
} from '../../src/v6/reader/browser-packages.ts';
import type {
  InstalledScripturePackage,
  ScripturePackageRepository,
  ScripturePackageTransport,
} from '../../src/v6/reader/package-manager.ts';
import {
  SCRIPTURE_PACKAGE_METADATA_CACHE_NAME,
  SCRIPTURE_PACKAGE_PAYLOAD_CACHE_NAME,
  scripturePackageMetadataUrl,
} from '../../src/v6/reader/package-storage.ts';

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
  const installed = new Map<string, InstalledScripturePackage>();
  const payloads = new Map<string, ArrayBuffer>();
  const key = (translationId: string, bookCode: string) => `${translationId}:${bookCode}`;
  const value: ScripturePackageRepository = {
    async readInstalled(translationId, bookCode) {
      return installed.get(key(translationId, bookCode)) ?? null;
    },
    async readInstalledPayload(translationId, bookCode) {
      return payloads.get(key(translationId, bookCode))?.slice(0) ?? null;
    },
    async listInstalled() { return [...installed.values()]; },
    async replaceInstalled(record, payload) { installed.set(key(record.translationId, record.bookCode), record); payloads.set(key(record.translationId, record.bookCode), payload.slice(0)); },
    async removeInstalled(translationId, bookCode) {
      installed.delete(key(translationId, bookCode));
      payloads.delete(key(translationId, bookCode));
    },
    async usage() { return { bytes: [...installed.values()].reduce((sum, record) => sum + record.bytes, 0), packages: installed.size }; },
  };
  return { value, installed: () => [...installed.values()][0] ?? null, records: () => [...installed.values()] };
}

function twoBookManifest(): ScriptureTranslationManifest {
  return {
    ...manifest(),
    books: [
      { bookCode: 'GEN', url: 'data/packs/bible/GEN.json', sha256: abcSha, bytes: 3 },
      { bookCode: 'JHN', url: 'data/packs/bible/JHN.json', sha256: abcSha, bytes: 3 },
    ],
  };
}

function fullBibleManifest(): ScriptureTranslationManifest {
  return {
    ...manifest(),
    books: CANONICAL_BIBLE_BOOK_CODES.map(bookCode => ({
      bookCode, url: `data/packs/bible/${bookCode}.json`, sha256: abcSha, bytes: 3,
    })),
  };
}

function browserCaches() {
  const stores = new Map<string, Map<string, Response>>();
  return {
    async open(name: string) {
      const store = stores.get(name) ?? new Map<string, Response>();
      stores.set(name, store);
      const keyText = (key: string | Request) => typeof key === 'string' ? key : key.url;
      return {
        async match(key: string | Request) { return store.get(keyText(key))?.clone(); },
        async put(key: string, value: Response) { store.set(key, value.clone()); },
        async delete(key: string | Request) { return store.delete(keyText(key)); },
        async keys() { return [...store.keys()].map(key => new Request(key)); },
      };
    },
  } as unknown as CacheStorage;
}

function manifestFetcher({failFirst = false, value = manifest()}: { failFirst?: boolean; value?: ScriptureTranslationManifest } = {}) {
  let requests = 0;
  return {
    requests: () => requests,
    fetcher: (async () => {
      requests += 1;
      if (failFirst && requests === 1) return new Response('nope', { status: 503 });
      return new Response(JSON.stringify(value), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch,
  };
}

test('legacy Reader revalidation preserves the exact bytes of a managed offline package', async () => {
  const cacheStorage = browserCaches();
  const locationRef = { href: 'https://example.test/app/' } as Location;
  const sourcePack = [{ c: 1, v: 1, t: 'In the beginning God created the heavens and the earth.' }];
  const verifiedBytes = new TextEncoder().encode(JSON.stringify(sourcePack));
  const verifiedText = new TextDecoder().decode(verifiedBytes);
  const payloadKey = new URL('data/packs/bible/JHN.json', locationRef.href).href;
  const metadataKey = scripturePackageMetadataUrl('bsb', 'JHN', locationRef.href);
  const payloadCache = await cacheStorage.open(SCRIPTURE_PACKAGE_PAYLOAD_CACHE_NAME);
  const metadataCache = await cacheStorage.open(SCRIPTURE_PACKAGE_METADATA_CACHE_NAME);
  await payloadCache.put(payloadKey, new Response(verifiedBytes, {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  }));
  await metadataCache.put(metadataKey, new Response(JSON.stringify({
    key: 'bsb:test:JHN',
    translationId: 'bsb',
    contentVersion: 'sha256-test',
    bookCode: 'JHN',
    sha256: createHash('sha256').update(verifiedBytes).digest('hex'),
    bytes: verifiedBytes.byteLength,
    installedAt: '2026-09-28T00:00:00.000Z',
  })));

  const repository = createBrowserScripturePackageRepository({ cacheStorage, locationRef });
  assert.ok(await repository.readInstalled('bsb', 'JHN'));

  const bible = createBibleDataService({
    fetcher: async () => new Response(JSON.stringify(sourcePack, null, 2), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
    packStore: createOpenedPackStore({ cacheStorage, locationRef }),
  });
  await bible.loadChapter('bsb', 'JHN', 1);

  const preserved = await (await payloadCache.match(payloadKey))?.arrayBuffer();
  assert.ok(preserved);
  assert.deepEqual(new Uint8Array(preserved), verifiedBytes);
  assert.ok(await repository.readInstalled('bsb', 'JHN'), 'managed checksum metadata must remain valid after Reader revalidation');
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

test('browser package controller searches verified installed book bytes without network access', async () => {
  const payload = new TextEncoder().encode(JSON.stringify([
    { c: 3, v: 16, t: 'For God so loved the world' },
    { c: 3, v: 17, t: 'For God did not send the Son to judge the world' },
  ])).buffer;
  const sha256 = createHash('sha256').update(new Uint8Array(payload)).digest('hex');
  const remote = manifestFetcher({ value: {
    ...manifest(),
    books: [{ bookCode: 'JHN', url: 'data/packs/bible/JHN.json', sha256, bytes: payload.byteLength }],
  } });
  const repo = memoryRepository();
  let requests = 0;
  const controller = createBrowserScripturePackageController({
    repository: repo.value,
    books: [{ code: 'JHN', name: 'John', chapters: 21 }],
    fetcher: remote.fetcher,
    transport: { async download() { requests += 1; return payload.slice(0); } },
  });

  await controller.install('bsb', 'JHN');
  const transportRequests = requests;
  const manifestRequests = remote.requests();
  const result = await controller.searchOfflineText('bsb', 'loved the world', 10);

  assert.deepEqual(result.results.map(hit => hit.reference), ['John 3:16']);
  assert.equal(requests, transportRequests, 'installed-only search must not download Scripture');
  assert.equal(remote.requests(), manifestRequests, 'installed-only search must not fetch a manifest');
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

test('a newer manifest keeps the verified installed copy readable and exposes an explicit update', async () => {
  const repo = memoryRepository();
  const stale = Object.freeze({
    key: 'bsb:stale:JHN:' + 'b'.repeat(64), translationId: 'bsb', contentVersion: 'stale',
    bookCode: 'JHN', sha256: 'b'.repeat(64), bytes: 3, installedAt: '2026-09-20T00:00:00.000Z',
  });
  await repo.value.replaceInstalled(stale, new ArrayBuffer(3));
  const controller = createBrowserScripturePackageController({
    repository: repo.value,
    transport: { async download() { return new TextEncoder().encode('abc').buffer; } },
    fetcher: manifestFetcher().fetcher,
  });

  const snapshot = await controller.snapshot('bsb', 'JHN');
  assert.equal(snapshot.installed?.contentVersion, 'stale');
  assert.equal(snapshot.updateAvailable, true);

  const installed = await controller.install('bsb', 'JHN');
  assert.equal(installed.status, 'installed');
  assert.equal(repo.installed()?.sha256, abcSha);
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

test('full-translation download installs every declared book, reports aggregate progress and can be removed', async () => {
  const repo = memoryRepository();
  const remote = manifestFetcher({ value: fullBibleManifest() });
  const downloaded: string[] = [];
  const progress: number[] = [];
  const controller = createBrowserScripturePackageController({
    repository: repo.value,
    transport: {
      async download(url, options) {
        downloaded.push(url);
        options.onProgress?.(3, 3);
        return new TextEncoder().encode('abc').buffer;
      },
    },
    fetcher: remote.fetcher,
  });

  const result = await controller.installTranslation('bsb', value => {
    if (value.ratio !== null) progress.push(value.ratio);
  });

  assert.deepEqual(repo.records().map(row => row.bookCode), [...CANONICAL_BIBLE_BOOK_CODES]);
  assert.equal(result.totalBooks, 66);
  assert.equal(result.installedBooks, 66);
  assert.equal(result.installedBytes, 198);
  assert.equal(downloaded.length, 66);
  assert.equal(progress.at(-1), 1);
  assert.equal((await controller.translationSnapshot('bsb')).installedBooks, 66);

  await controller.removeTranslation('bsb');
  assert.deepEqual(repo.records(), []);
});

test('cancelled full-translation download preserves completed books and resumes only missing books', async () => {
  const repo = memoryRepository();
  const remote = manifestFetcher({ value: fullBibleManifest() });
  let secondBookStarted!: () => void;
  const secondStarted = new Promise<void>(resolve => { secondBookStarted = resolve; });
  let blockSecond = true;
  const controller = createBrowserScripturePackageController({
    repository: repo.value,
    transport: {
      async download(url, { signal, onProgress }) {
        if (url.endsWith('/EXO.json') && blockSecond) {
          secondBookStarted();
          return await new Promise<ArrayBuffer>((_resolve, reject) => {
            const abort = () => {
              const error = new Error('cancelled');
              error.name = 'AbortError';
              reject(error);
            };
            if (signal.aborted) abort();
            else signal.addEventListener('abort', abort, { once: true });
          });
        }
        onProgress?.(3, 3);
        return new TextEncoder().encode('abc').buffer;
      },
    },
    fetcher: remote.fetcher,
  });

  const pending = controller.installTranslation('bsb');
  await secondStarted;
  assert.deepEqual(repo.records().map(row => row.bookCode), ['GEN']);
  assert.equal(controller.cancelTranslation('bsb'), true);
  await assert.rejects(pending, error => (error as Error).name === 'AbortError');
  assert.deepEqual(repo.records().map(row => row.bookCode), ['GEN']);

  blockSecond = false;
  const resumed = await controller.installTranslation('bsb');
  assert.equal(resumed.installedBooks, 66);
  assert.deepEqual(repo.records().map(row => row.bookCode), [...CANONICAL_BIBLE_BOOK_CODES]);
});

test('full-translation download fails closed when a manifest omits Bible books', async () => {
  const repo = memoryRepository();
  let downloads = 0;
  const controller = createBrowserScripturePackageController({
    repository: repo.value,
    transport: { async download() { downloads += 1; return new TextEncoder().encode('abc').buffer; } },
    fetcher: manifestFetcher({ value: twoBookManifest() }).fetcher,
  });

  const snapshot = await controller.translationSnapshot('bsb');
  assert.equal(snapshot.downloadable, false);
  assert.match(snapshot.reason, /inventory-incomplete/i);
  await assert.rejects(controller.installTranslation('bsb'), /inventory-incomplete/i);
  assert.equal(downloads, 0);
  assert.deepEqual(repo.records(), []);
});

test('corrupted cached package bytes are deleted so a fresh verified download can recover', async () => {
  const caches = browserCaches();
  const locationRef = { href: 'https://example.test/app/' } as Location;
  const repository = createBrowserScripturePackageRepository({
    cacheStorage: caches,
    locationRef,
  });
  const record: InstalledScripturePackage = {
    key: 'bsb:test:JHN:' + abcSha, translationId: 'bsb', contentVersion: 'test',
    bookCode: 'JHN', sha256: abcSha, bytes: 3, installedAt: '2026-09-20T00:00:00.000Z',
  };
  await repository.replaceInstalled(record, new TextEncoder().encode('abc').buffer);
  const payloadCache = await caches.open(SCRIPTURE_PACKAGE_PAYLOAD_CACHE_NAME);
  await payloadCache.put(new URL('data/packs/bible/JHN.json', locationRef.href).href, new Response('bad'));
  assert.deepEqual(await repository.usage(), { bytes: 0, packages: 0 }, 'quota usage must exclude unverified cached payloads');

  let downloads = 0;
  const controller = createBrowserScripturePackageController({
    repository,
    transport: {
      async download() {
        downloads += 1;
        return new TextEncoder().encode('abc').buffer;
      },
    },
    fetcher: manifestFetcher().fetcher,
  });

  const beforeRecovery = await controller.snapshot('bsb', 'JHN');
  assert.equal(beforeRecovery.installed, null, 'corrupt bytes must not be presented as an installed offline book');
  assert.deepEqual(beforeRecovery.usage, { bytes: 0, packages: 0 }, 'corrupt package metadata must not count toward offline storage');

  const result = await controller.install('bsb', 'JHN');
  assert.equal(result.status, 'installed');
  assert.equal(downloads, 1, 'recovery must fetch fresh bytes rather than trusting the damaged cache entry');
  assert.deepEqual(new Uint8Array((await repository.readInstalledPayload?.('bsb', 'JHN'))!), new TextEncoder().encode('abc'));
  assert.equal((await controller.snapshot('bsb', 'JHN')).installed?.sha256, abcSha);
  assert.deepEqual(await repository.usage(), { bytes: 3, packages: 1 });
});

test('installed package inventory verifies package bytes and lists only intact books', async () => {
  const caches = browserCaches();
  const repository = createBrowserScripturePackageRepository({
    cacheStorage: caches,
    locationRef: { href: 'https://example.test/app/' } as Location,
  });
  const make = (bookCode: string, text: string): InstalledScripturePackage => ({
    key: `bsb:test:${bookCode}:${abcSha}`, translationId: 'bsb', contentVersion: 'test',
    bookCode, sha256: abcSha, bytes: new TextEncoder().encode(text).byteLength,
    installedAt: '2026-09-20T00:00:00.000Z',
  });
  await repository.replaceInstalled(make('GEN', 'abc'), new TextEncoder().encode('abc').buffer);
  await repository.replaceInstalled(make('JHN', 'abc'), new TextEncoder().encode('abc').buffer);

  const payloadCache = await caches.open('biblequest-v3-opened-bible-packs-v1');
  await payloadCache.put('https://example.test/app/data/packs/bible/JHN.json', new Response('bad'));
  const inventory = await repository.listInstalled();

  assert.deepEqual(inventory.map(item => item.bookCode), ['GEN']);
  assert.deepEqual(await repository.usage(), { bytes: 3, packages: 1 });
});

import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import {
  ScripturePackageDownloadError,
  createScripturePackageDownloader
} from '../src/offline/scripture-package-download.js';

const GOOD_BYTES = new Uint8Array([1, 2, 3, 4]);
const GOOD_SHA256 = '9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a';

function manifest(overrides = {}) {
  return {
    schemaVersion: 1,
    packageId: 'web-en-jhn-v1',
    translationId: 'web',
    contentVersion: '2026.09',
    scope: 'book',
    books: ['JHN'],
    contentPath: '/offline/web/jhn.json',
    byteSize: 4,
    generatedAt: '2026-09-13T00:00:00Z',
    checksum: { algorithm: 'sha256', value: GOOD_SHA256 },
    license: { redistributionAllowed: true, source: 'World English Bible' },
    ...overrides
  };
}

function response(bytes = GOOD_BYTES, overrides = {}) {
  return {
    ok: true,
    status: 200,
    async arrayBuffer() {
      const copy = Uint8Array.from(bytes);
      return copy.buffer;
    },
    ...overrides
  };
}

function repositorySpy() {
  const writes = [];
  return {
    writes,
    async put(record) {
      writes.push(record);
      return 'web:2026.09:book:JHN';
    }
  };
}

test('verifies SHA-256 before committing a same-origin package', async () => {
  const repository = repositorySpy();
  const calls = [];
  const downloader = createScripturePackageDownloader({
    repository,
    cryptoImpl: webcrypto,
    fetchImpl: async (path, options) => {
      calls.push({ path, options });
      return response();
    }
  });

  const result = await downloader.download(manifest(), {
    installedAt: '2026-09-13T02:00:00Z'
  });

  assert.equal(result.key, 'web:2026.09:book:JHN');
  assert.equal(result.checksum, GOOD_SHA256);
  assert.equal(repository.writes.length, 1);
  assert.deepEqual([...repository.writes[0].content], [...GOOD_BYTES]);
  assert.equal(calls[0].path, '/offline/web/jhn.json');
  assert.equal(calls[0].options.credentials, 'same-origin');
  assert.equal(calls[0].options.cache, 'no-store');
});

test('rejects corrupt bytes without touching durable storage', async () => {
  const repository = repositorySpy();
  const downloader = createScripturePackageDownloader({
    repository,
    cryptoImpl: webcrypto,
    fetchImpl: async () => response(new Uint8Array([4, 3, 2, 1]))
  });

  await assert.rejects(
    downloader.download(manifest()),
    error => error instanceof ScripturePackageDownloadError && error.code === 'CHECKSUM_MISMATCH'
  );
  assert.equal(repository.writes.length, 0);
});

test('rejects size mismatch before hashing or storage', async () => {
  const repository = repositorySpy();
  let digestCalls = 0;
  const cryptoImpl = {
    subtle: {
      async digest() {
        digestCalls += 1;
        return new ArrayBuffer(32);
      }
    }
  };
  const downloader = createScripturePackageDownloader({
    repository,
    cryptoImpl,
    fetchImpl: async () => response(new Uint8Array([1, 2, 3]))
  });

  await assert.rejects(
    downloader.download(manifest()),
    error => error.code === 'SIZE_MISMATCH'
  );
  assert.equal(digestCalls, 0);
  assert.equal(repository.writes.length, 0);
});

test('surfaces HTTP failure without storage mutation', async () => {
  const repository = repositorySpy();
  const downloader = createScripturePackageDownloader({
    repository,
    cryptoImpl: webcrypto,
    fetchImpl: async () => response(GOOD_BYTES, { ok: false, status: 503 })
  });

  await assert.rejects(
    downloader.download(manifest()),
    error => error.code === 'HTTP_ERROR'
  );
  assert.equal(repository.writes.length, 0);
});

test('wraps fetch failure while preserving explicit cancellation', async () => {
  const repository = repositorySpy();
  const downloader = createScripturePackageDownloader({
    repository,
    cryptoImpl: webcrypto,
    fetchImpl: async () => { throw new Error('offline'); }
  });

  await assert.rejects(
    downloader.download(manifest()),
    error => error.code === 'NETWORK_ERROR' && error.cause?.message === 'offline'
  );

  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    downloader.download(manifest(), { signal: controller.signal }),
    /offline/
  );
  assert.equal(repository.writes.length, 0);
});

test('retry after corruption commits only the later verified package', async () => {
  const repository = repositorySpy();
  let attempt = 0;
  const downloader = createScripturePackageDownloader({
    repository,
    cryptoImpl: webcrypto,
    fetchImpl: async () => {
      attempt += 1;
      return attempt === 1
        ? response(new Uint8Array([4, 3, 2, 1]))
        : response();
    }
  });

  await assert.rejects(downloader.download(manifest()), error => error.code === 'CHECKSUM_MISMATCH');
  const result = await downloader.download(manifest());

  assert.equal(result.checksum, GOOD_SHA256);
  assert.equal(repository.writes.length, 1);
});

test('fails closed when SHA-256 support is unavailable', async () => {
  const repository = repositorySpy();
  const downloader = createScripturePackageDownloader({
    repository,
    cryptoImpl: {},
    fetchImpl: async () => response()
  });

  await assert.rejects(
    downloader.download(manifest()),
    error => error.code === 'CRYPTO_UNAVAILABLE'
  );
  assert.equal(repository.writes.length, 0);
});

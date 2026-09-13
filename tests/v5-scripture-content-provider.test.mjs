import assert from 'node:assert/strict';
import test from 'node:test';
import { createScriptureContentProvider, ScriptureContentProviderError } from '../src/offline/scripture-content-provider.js';

const encoder = new TextEncoder();

function manifest(overrides = {}) {
  const payload = JSON.stringify([{ c: 1, v: 1, t: 'In the beginning.' }]);
  return {
    schemaVersion: 1,
    packageId: 'web-jhn-v1',
    translationId: 'web',
    contentVersion: '2026.09',
    scope: 'book',
    books: ['JHN'],
    contentPath: '/offline/web/jhn.json',
    byteSize: encoder.encode(payload).byteLength,
    generatedAt: '2026-09-13T00:00:00Z',
    checksum: { algorithm: 'sha256', value: 'a'.repeat(64) },
    license: { redistributionAllowed: true, source: 'World English Bible' },
    ...overrides
  };
}

function recordFor(value = manifest(), payload = [{ c: 1, v: 1, t: 'In the beginning.' }]) {
  return { manifest: value, content: encoder.encode(JSON.stringify(payload)) };
}

function harness(initialRecord = null) {
  let record = initialRecord;
  const calls = { get: 0, remove: 0, download: 0 };
  const repository = {
    async get() { calls.get++; return record; },
    async remove() { calls.remove++; record = null; }
  };
  const downloader = {
    async download(value) {
      calls.download++;
      record = recordFor(value, [{ c: 1, v: 1, t: 'Downloaded.' }]);
      return { key: 'web:2026.09:book:JHN' };
    }
  };
  return { calls, repository, downloader, setRecord: value => { record = value; } };
}

test('returns verified local package without network activity', async () => {
  const h = harness(recordFor());
  const provider = createScriptureContentProvider(h);
  const result = await provider.load(manifest());
  assert.equal(result.source, 'offline');
  assert.equal(result.payload[0].t, 'In the beginning.');
  assert.deepEqual(h.calls, { get: 1, remove: 0, download: 0 });
});

test('downloads only when the exact package is absent', async () => {
  const h = harness(null);
  const provider = createScriptureContentProvider(h);
  const result = await provider.load(manifest());
  assert.equal(result.source, 'download');
  assert.equal(result.payload[0].t, 'Downloaded.');
  assert.deepEqual(h.calls, { get: 2, remove: 0, download: 1 });
});

test('offline-only reads fail without invoking the downloader', async () => {
  const h = harness(null);
  const provider = createScriptureContentProvider(h);
  await assert.rejects(
    provider.load(manifest(), { allowNetwork: false }),
    error => error instanceof ScriptureContentProviderError && error.code === 'OFFLINE_PACKAGE_MISSING'
  );
  assert.equal(h.calls.download, 0);
});

test('manifest mismatch removes the stored record and repairs through verified download', async () => {
  const expected = manifest();
  const mismatched = manifest({ packageId: 'other-package' });
  const h = harness(recordFor(mismatched));
  const provider = createScriptureContentProvider(h);
  const result = await provider.load(expected);
  assert.equal(result.source, 'download');
  assert.equal(h.calls.remove, 1);
  assert.equal(h.calls.download, 1);
});

test('malformed local UTF-8/JSON is removed before verified redownload', async () => {
  const h = harness({ manifest: manifest(), content: encoder.encode('{not-json') });
  const provider = createScriptureContentProvider(h);
  const result = await provider.load(manifest());
  assert.equal(result.source, 'download');
  assert.equal(h.calls.remove, 1);
  assert.equal(h.calls.download, 1);
});

test('offline-only corrupt content fails closed after removing it', async () => {
  const h = harness({ manifest: manifest(), content: encoder.encode('{not-json') });
  const provider = createScriptureContentProvider(h);
  await assert.rejects(
    provider.load(manifest(), { allowNetwork: false }),
    error => error instanceof ScriptureContentProviderError && error.code === 'LOCAL_CONTENT_INVALID'
  );
  assert.equal(h.calls.remove, 1);
  assert.equal(h.calls.download, 0);
});

test('verified download must become readable durable content before returning', async () => {
  const h = harness(null);
  h.downloader.download = async () => { h.calls.download++; };
  const provider = createScriptureContentProvider(h);
  await assert.rejects(
    provider.load(manifest()),
    error => error instanceof ScriptureContentProviderError && error.code === 'DOWNLOAD_NOT_PERSISTED'
  );
});

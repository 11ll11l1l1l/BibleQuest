import assert from 'node:assert/strict';
import test from 'node:test';
import { createScripturePackageRepository } from '../src/offline/scripture-package-repository.js';

function clone(value) {
  return structuredClone(value);
}

class FakeRequest {
  constructor(run) {
    queueMicrotask(() => {
      try {
        this.result = run();
        this.onsuccess?.();
      } catch (error) {
        this.error = error;
        this.onerror?.();
      }
    });
  }
}

class FakeStore {
  constructor(records, transaction) {
    this.records = records;
    this.transaction = transaction;
  }
  createIndex() {}
  put(record) {
    this.records.set(record.key, clone(record));
    this.transaction.finishSoon();
    return new FakeRequest(() => record.key);
  }
  get(key) {
    const request = new FakeRequest(() => {
      const value = this.records.get(key);
      return value ? clone(value) : undefined;
    });
    this.transaction.finishSoon();
    return request;
  }
  getAll() {
    const request = new FakeRequest(() => [...this.records.values()].map(clone));
    this.transaction.finishSoon();
    return request;
  }
  delete(key) {
    this.records.delete(key);
    this.transaction.finishSoon();
    return new FakeRequest(() => undefined);
  }
  index(name) {
    assert.equal(name, 'translationId');
    return {
      getAll: value => {
        const request = new FakeRequest(() => [...this.records.values()]
          .filter(record => record.translationId === value)
          .map(clone));
        this.transaction.finishSoon();
        return request;
      }
    };
  }
}

class FakeTransaction {
  constructor(records) {
    this.records = records;
    this.pendingFinish = false;
  }
  objectStore() {
    return new FakeStore(this.records, this);
  }
  finishSoon() {
    if (this.pendingFinish) return;
    this.pendingFinish = true;
    setTimeout(() => this.oncomplete?.(), 0);
  }
}

class FakeDatabase {
  constructor() {
    this.records = new Map();
    this.created = false;
    this.objectStoreNames = { contains: name => this.created && name === 'packages' };
  }
  createObjectStore(name) {
    assert.equal(name, 'packages');
    this.created = true;
    return { createIndex() {} };
  }
  transaction(name) {
    assert.equal(name, 'packages');
    return new FakeTransaction(this.records);
  }
  close() {}
}

function fakeIndexedDB() {
  const db = new FakeDatabase();
  return {
    open(name, version) {
      assert.match(name, /^test-/);
      assert.equal(version, 1);
      const request = {};
      queueMicrotask(() => {
        request.result = db;
        request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    }
  };
}

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
    checksum: { algorithm: 'sha256', value: 'a'.repeat(64) },
    license: { redistributionAllowed: true, source: 'World English Bible' },
    ...overrides
  };
}

test('stores, reads, lists and removes a validated package without mutating caller bytes', async () => {
  const repository = createScripturePackageRepository({ indexedDB: fakeIndexedDB(), dbName: 'test-basic' });
  const bytes = new Uint8Array([1, 2, 3, 4]);
  const key = await repository.put({ manifest: manifest(), content: bytes, installedAt: '2026-09-13T01:00:00Z' });
  bytes[0] = 9;

  assert.equal(key, 'web:2026.09:book:JHN');
  const stored = await repository.get(key);
  assert.deepEqual([...stored.content], [1, 2, 3, 4]);
  assert.equal(stored.manifest.license.redistributionAllowed, true);

  assert.deepEqual(await repository.list(), [{
    key,
    packageId: 'web-en-jhn-v1',
    translationId: 'web',
    contentVersion: '2026.09',
    scope: 'book',
    books: ['JHN'],
    byteSize: 4,
    installedAt: '2026-09-13T01:00:00.000Z'
  }]);

  await repository.remove(key);
  assert.equal(await repository.get(key), null);
});

test('rejects content whose byte length disagrees with the manifest before storage', async () => {
  const repository = createScripturePackageRepository({ indexedDB: fakeIndexedDB(), dbName: 'test-size' });
  await assert.rejects(
    repository.put({ manifest: manifest(), content: new Uint8Array([1, 2, 3]) }),
    /content size does not match/
  );
  assert.deepEqual(await repository.list(), []);
});

test('filters package metadata by normalized translation identity', async () => {
  const repository = createScripturePackageRepository({ indexedDB: fakeIndexedDB(), dbName: 'test-filter' });
  await repository.put({ manifest: manifest(), content: new Uint8Array([1, 2, 3, 4]) });
  await repository.put({
    manifest: manifest({
      packageId: 'eng2-jhn-v1',
      translationId: 'eng2',
      contentVersion: 'v1',
      contentPath: '/offline/eng2/jhn.json'
    }),
    content: new Uint8Array([5, 6, 7, 8])
  });

  const webOnly = await repository.list({ translationId: ' WEB ' });
  assert.equal(webOnly.length, 1);
  assert.equal(webOnly[0].translationId, 'web');
});

test('fails closed when IndexedDB is unavailable', () => {
  assert.throws(() => createScripturePackageRepository({ indexedDB: null }), /IndexedDB is required/);
});

test('rejects unsupported content representations', async () => {
  const repository = createScripturePackageRepository({ indexedDB: fakeIndexedDB(), dbName: 'test-content-type' });
  await assert.rejects(repository.put({ manifest: manifest(), content: '1234' }), /ArrayBuffer or Uint8Array/);
});

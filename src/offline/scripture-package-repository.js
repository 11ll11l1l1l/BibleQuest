import { scripturePackageKey, validateScriptureManifest } from './content-manifest.js';

export const SCRIPTURE_PACKAGE_DB_NAME = 'biblequest-scripture-packages';
export const SCRIPTURE_PACKAGE_DB_VERSION = 1;
export const SCRIPTURE_PACKAGE_STORE = 'packages';

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
  });
}

function normalizeContent(content) {
  if (content instanceof Uint8Array) return new Uint8Array(content);
  if (content instanceof ArrayBuffer) return new Uint8Array(content.slice(0));
  throw new TypeError('Scripture package content must be an ArrayBuffer or Uint8Array.');
}

export function createScripturePackageRepository({
  indexedDB = globalThis.indexedDB,
  dbName = SCRIPTURE_PACKAGE_DB_NAME
} = {}) {
  if (!indexedDB || typeof indexedDB.open !== 'function') {
    throw new Error('IndexedDB is required for offline Scripture packages.');
  }

  let dbPromise;

  function openDatabase() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, SCRIPTURE_PACKAGE_DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(SCRIPTURE_PACKAGE_STORE)) {
            const store = db.createObjectStore(SCRIPTURE_PACKAGE_STORE, { keyPath: 'key' });
            store.createIndex('translationId', 'translationId', { unique: false });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          dbPromise = undefined;
          reject(request.error ?? new Error('Failed to open Scripture package database.'));
        };
        request.onblocked = () => {
          dbPromise = undefined;
          reject(new Error('Scripture package database upgrade is blocked.'));
        };
      });
    }
    return dbPromise;
  }

  async function put({ manifest, content, installedAt = new Date().toISOString() }) {
    const normalizedManifest = validateScriptureManifest(manifest);
    const bytes = normalizeContent(content);
    if (bytes.byteLength !== normalizedManifest.byteSize) {
      throw new Error('Scripture package content size does not match manifest.byteSize.');
    }

    const installedTimestamp = Date.parse(installedAt);
    if (!Number.isFinite(installedTimestamp)) throw new Error('installedAt must be a valid timestamp.');

    const key = scripturePackageKey(normalizedManifest);
    const record = {
      key,
      packageId: normalizedManifest.packageId,
      translationId: normalizedManifest.translationId,
      contentVersion: normalizedManifest.contentVersion,
      scope: normalizedManifest.scope,
      books: [...normalizedManifest.books],
      manifest: normalizedManifest,
      content: bytes,
      installedAt: new Date(installedTimestamp).toISOString()
    };

    const db = await openDatabase();
    const transaction = db.transaction(SCRIPTURE_PACKAGE_STORE, 'readwrite');
    transaction.objectStore(SCRIPTURE_PACKAGE_STORE).put(record);
    await transactionDone(transaction);
    return key;
  }

  async function get(key) {
    const db = await openDatabase();
    const transaction = db.transaction(SCRIPTURE_PACKAGE_STORE, 'readonly');
    const record = await requestResult(transaction.objectStore(SCRIPTURE_PACKAGE_STORE).get(String(key)));
    await transactionDone(transaction);
    if (!record) return null;
    return {
      ...record,
      books: [...record.books],
      content: new Uint8Array(record.content)
    };
  }

  async function list({ translationId } = {}) {
    const db = await openDatabase();
    const transaction = db.transaction(SCRIPTURE_PACKAGE_STORE, 'readonly');
    const store = transaction.objectStore(SCRIPTURE_PACKAGE_STORE);
    const request = translationId
      ? store.index('translationId').getAll(String(translationId).trim().toLowerCase())
      : store.getAll();
    const records = await requestResult(request);
    await transactionDone(transaction);
    return records
      .map(record => ({
        key: record.key,
        packageId: record.packageId,
        translationId: record.translationId,
        contentVersion: record.contentVersion,
        scope: record.scope,
        books: [...record.books],
        byteSize: record.manifest.byteSize,
        installedAt: record.installedAt
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  async function remove(key) {
    const db = await openDatabase();
    const transaction = db.transaction(SCRIPTURE_PACKAGE_STORE, 'readwrite');
    transaction.objectStore(SCRIPTURE_PACKAGE_STORE).delete(String(key));
    await transactionDone(transaction);
  }

  async function close() {
    if (!dbPromise) return;
    const db = await dbPromise;
    db.close();
    dbPromise = undefined;
  }

  return Object.freeze({ put, get, list, remove, close });
}

import { scripturePackageKey, validateScriptureManifest } from './content-manifest.js';

export class ScriptureContentProviderError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = 'ScriptureContentProviderError';
    this.code = code;
  }
}

function decodeJson(content) {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(content);
    return JSON.parse(text);
  } catch (error) {
    throw new ScriptureContentProviderError(
      'LOCAL_CONTENT_INVALID',
      'Stored offline Scripture content is not valid UTF-8 JSON.',
      { cause: error }
    );
  }
}

function sameManifest(actual, expected) {
  if (!actual) return false;
  return actual.packageId === expected.packageId
    && actual.translationId === expected.translationId
    && actual.contentVersion === expected.contentVersion
    && actual.scope === expected.scope
    && actual.checksum?.value === expected.checksum.value
    && Array.isArray(actual.books)
    && actual.books.length === expected.books.length
    && actual.books.every((book, index) => book === expected.books[index]);
}

export function createScriptureContentProvider({ repository, downloader } = {}) {
  if (!repository || typeof repository.get !== 'function' || typeof repository.remove !== 'function') {
    throw new TypeError('A Scripture package repository with get() and remove() is required.');
  }
  if (!downloader || typeof downloader.download !== 'function') {
    throw new TypeError('A Scripture package downloader with download() is required.');
  }

  async function readLocal(manifest) {
    const normalizedManifest = validateScriptureManifest(manifest);
    const key = scripturePackageKey(normalizedManifest);
    const record = await repository.get(key);
    if (!record) return null;

    if (!sameManifest(record.manifest, normalizedManifest)) {
      await repository.remove(key);
      throw new ScriptureContentProviderError(
        'LOCAL_MANIFEST_MISMATCH',
        'Stored offline Scripture metadata does not match the requested manifest.'
      );
    }

    try {
      return Object.freeze({
        key,
        source: 'offline',
        manifest: normalizedManifest,
        payload: decodeJson(record.content)
      });
    } catch (error) {
      try { await repository.remove(key); } catch {}
      throw error;
    }
  }

  async function load(manifest, { allowNetwork = true, signal } = {}) {
    const normalizedManifest = validateScriptureManifest(manifest);

    try {
      const local = await readLocal(normalizedManifest);
      if (local) return local;
    } catch (error) {
      if (!allowNetwork) throw error;
    }

    if (!allowNetwork) {
      throw new ScriptureContentProviderError(
        'OFFLINE_PACKAGE_MISSING',
        'The requested Scripture package is not available offline.'
      );
    }

    await downloader.download(normalizedManifest, { signal });
    const downloaded = await readLocal(normalizedManifest);
    if (!downloaded) {
      throw new ScriptureContentProviderError(
        'DOWNLOAD_NOT_PERSISTED',
        'Verified Scripture download completed without a readable stored package.'
      );
    }

    return Object.freeze({ ...downloaded, source: 'download' });
  }

  return Object.freeze({ load, readLocal });
}

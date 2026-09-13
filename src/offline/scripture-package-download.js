import { scripturePackageKey, validateScriptureManifest } from './content-manifest.js';

export class ScripturePackageDownloadError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = 'ScripturePackageDownloadError';
    this.code = code;
  }
}

function bytesToHex(bytes) {
  return Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(bytes, cryptoImpl) {
  if (!cryptoImpl?.subtle || typeof cryptoImpl.subtle.digest !== 'function') {
    throw new ScripturePackageDownloadError(
      'CRYPTO_UNAVAILABLE',
      'Web Crypto SHA-256 support is required to verify offline Scripture packages.'
    );
  }
  const digest = await cryptoImpl.subtle.digest('SHA-256', bytes);
  return bytesToHex(new Uint8Array(digest));
}

export function createScripturePackageDownloader({
  repository,
  fetchImpl = globalThis.fetch,
  cryptoImpl = globalThis.crypto
} = {}) {
  if (!repository || typeof repository.put !== 'function') {
    throw new TypeError('A Scripture package repository with put() is required.');
  }
  if (typeof fetchImpl !== 'function') {
    throw new TypeError('fetch is required to download Scripture packages.');
  }

  async function download(manifest, { signal, installedAt } = {}) {
    const normalizedManifest = validateScriptureManifest(manifest);
    let response;

    try {
      response = await fetchImpl(normalizedManifest.contentPath, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        signal,
        headers: {
          accept: 'application/json, application/octet-stream;q=0.9, */*;q=0.1'
        }
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new ScripturePackageDownloadError(
        'NETWORK_ERROR',
        'Failed to download the offline Scripture package.',
        { cause: error }
      );
    }

    if (!response?.ok || typeof response.arrayBuffer !== 'function') {
      throw new ScripturePackageDownloadError(
        'HTTP_ERROR',
        `Offline Scripture package download failed with HTTP ${response?.status ?? 'unknown'}.`
      );
    }

    const content = new Uint8Array(await response.arrayBuffer());
    if (content.byteLength !== normalizedManifest.byteSize) {
      throw new ScripturePackageDownloadError(
        'SIZE_MISMATCH',
        'Downloaded Scripture package size does not match its manifest.'
      );
    }

    const actualChecksum = await sha256Hex(content, cryptoImpl);
    if (actualChecksum !== normalizedManifest.checksum.value) {
      throw new ScripturePackageDownloadError(
        'CHECKSUM_MISMATCH',
        'Downloaded Scripture package failed SHA-256 verification.'
      );
    }

    const key = await repository.put({
      manifest: normalizedManifest,
      content,
      installedAt
    });

    return Object.freeze({
      key: key ?? scripturePackageKey(normalizedManifest),
      packageId: normalizedManifest.packageId,
      translationId: normalizedManifest.translationId,
      contentVersion: normalizedManifest.contentVersion,
      byteSize: content.byteLength,
      checksum: actualChecksum
    });
  }

  return Object.freeze({ download });
}

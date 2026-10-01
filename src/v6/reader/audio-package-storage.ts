import { verifyPackageChecksum } from './content-manifest.ts';
import { V6_AUDIO_SEGMENT_MAX_BYTES } from './audio-packages.ts';
import type {
  InstalledScriptureAudioPackage,
  ScriptureAudioPackageRepository,
  ScriptureAudioPackageTransport,
} from './audio-packages.ts';

export const SCRIPTURE_AUDIO_PAYLOAD_CACHE = 'biblequest-v6-scripture-audio-payload-v1';
export const SCRIPTURE_AUDIO_METADATA_CACHE = 'biblequest-v6-scripture-audio-metadata-v1';

const TRANSLATION_ID = /^[a-z0-9][a-z0-9_-]{0,31}$/;
const SEGMENT_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const SHA256_HEX = /^[a-f0-9]{64}$/i;


export class AudioPackageDownloadUnavailableError extends Error {
  readonly code = 'audio-download-unavailable';

  constructor(message = 'Offline audio download is unavailable from this source in this browser. Direct streaming remains usable.') {
    super(message);
    this.name = 'AudioPackageDownloadUnavailableError';
  }
}

function validRecord(value: unknown, translationId: string, segmentId: string): value is InstalledScriptureAudioPackage {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<InstalledScriptureAudioPackage>;
  return row.translationId === translationId
    && row.segmentId === segmentId
    && typeof row.audioContentVersion === 'string' && Boolean(row.audioContentVersion.trim())
    && typeof row.scriptureContentVersion === 'string' && Boolean(row.scriptureContentVersion.trim())
    && typeof row.book === 'string' && /^(?:[1-3])?[A-Z]{2,3}$/.test(row.book)
    && Number.isSafeInteger(row.chapter) && Number(row.chapter) > 0
    && SHA256_HEX.test(String(row.sha256 ?? ''))
    && Number.isSafeInteger(row.bytes) && Number(row.bytes) > 0
    && typeof row.installedAt === 'string' && Number.isFinite(Date.parse(row.installedAt));
}

export function createBrowserScriptureAudioPackageRepository(input: {
  readonly cacheStorage?: CacheStorage;
  readonly ResponseCtor?: typeof Response;
  readonly locationRef?: Location;
} = {}): ScriptureAudioPackageRepository {
  const cacheStorage = input.cacheStorage ?? globalThis.caches;
  const ResponseCtor = input.ResponseCtor ?? globalThis.Response;
  const locationRef = input.locationRef ?? globalThis.location;
  if (!cacheStorage?.open || typeof ResponseCtor !== 'function' || !locationRef?.href) {
    throw new Error('Browser audio-package storage is unavailable.');
  }

  const keys = (translationId: string, segmentId: string) => {
    const translation = String(translationId ?? '').trim();
    const segment = String(segmentId ?? '').trim();
    if (!TRANSLATION_ID.test(translation) || !SEGMENT_ID.test(segment)) throw new Error('Audio package identity is invalid.');
    const base = new URL('/__bq_v6_scripture_audio__/', locationRef.href);
    return Object.freeze({
      payload: new URL(`${encodeURIComponent(translation)}/${encodeURIComponent(segment)}.bin`, base).href,
      metadata: new URL(`${encodeURIComponent(translation)}/${encodeURIComponent(segment)}.json`, base).href,
    });
  };

  const deleteBoth = async (translationId: string, segmentId: string) => {
    const key = keys(translationId, segmentId);
    const [payloadCache, metadataCache] = await Promise.all([
      cacheStorage.open(SCRIPTURE_AUDIO_PAYLOAD_CACHE),
      cacheStorage.open(SCRIPTURE_AUDIO_METADATA_CACHE),
    ]);
    await Promise.all([payloadCache.delete(key.payload), metadataCache.delete(key.metadata)]);
  };

  const repository: ScriptureAudioPackageRepository = Object.freeze({
    async readInstalled(translationId: string, segmentId: string) {
      const id = String(translationId ?? '').trim();
      const segment = String(segmentId ?? '').trim();
      const key = keys(id, segment);
      const metadataCache = await cacheStorage.open(SCRIPTURE_AUDIO_METADATA_CACHE);
      const metadataResponse = await metadataCache.match(key.metadata);
      if (!metadataResponse) return null;
      let record: unknown;
      try { record = await metadataResponse.json(); }
      catch {
        await deleteBoth(id, segment);
        return null;
      }
      if (!validRecord(record, id, segment)) {
        await deleteBoth(id, segment);
        return null;
      }
      const payloadCache = await cacheStorage.open(SCRIPTURE_AUDIO_PAYLOAD_CACHE);
      const response = await payloadCache.match(key.payload);
      if (!response) {
        await deleteBoth(id, segment);
        return null;
      }
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== record.bytes || !await verifyPackageChecksum(bytes, record.sha256)) {
        await deleteBoth(id, segment);
        return null;
      }
      return Object.freeze({ ...record });
    },

    async readPayload(translationId: string, segmentId: string) {
      const record = await repository.readInstalled(translationId, segmentId);
      if (!record) return null;
      const key = keys(translationId, segmentId);
      const cache = await cacheStorage.open(SCRIPTURE_AUDIO_PAYLOAD_CACHE);
      const response = await cache.match(key.payload);
      if (!response) return null;
      const bytes = await response.arrayBuffer();
      return bytes.byteLength === record.bytes && await verifyPackageChecksum(bytes, record.sha256) ? bytes : null;
    },

    async listInstalled() {
      const metadataCache = await cacheStorage.open(SCRIPTURE_AUDIO_METADATA_CACHE);
      const requests = await metadataCache.keys();
      const identities = new Map<string, { translationId: string; segmentId: string }>();
      for (const request of requests) {
        try {
          const url = new URL(request.url);
          const prefix = '/__bq_v6_scripture_audio__/';
          if (!url.pathname.startsWith(prefix) || !url.pathname.endsWith('.json')) continue;
          const parts = url.pathname.slice(prefix.length).split('/');
          if (parts.length !== 2) continue;
          const translationId = decodeURIComponent(parts[0]!);
          const segmentId = decodeURIComponent(parts[1]!.slice(0, -5));
          if (!TRANSLATION_ID.test(translationId) || !SEGMENT_ID.test(segmentId)) continue;
          identities.set(`${translationId}:${segmentId}`, { translationId, segmentId });
        } catch { /* Ignore malformed cache keys. */ }
      }
      const records = await Promise.all([...identities.values()].map(row => repository.readInstalled(row.translationId, row.segmentId)));
      return Object.freeze(records.filter((row): row is InstalledScriptureAudioPackage => row !== null));
    },

    async replaceInstalled(record: InstalledScriptureAudioPackage, bytes: ArrayBuffer) {
      const key = keys(record.translationId, record.segmentId);
      if (!validRecord(record, record.translationId, record.segmentId)
        || bytes.byteLength !== record.bytes || !await verifyPackageChecksum(bytes, record.sha256)) {
        throw new Error('Audio package failed storage validation.');
      }
      const [payloadCache, metadataCache] = await Promise.all([
        cacheStorage.open(SCRIPTURE_AUDIO_PAYLOAD_CACHE),
        cacheStorage.open(SCRIPTURE_AUDIO_METADATA_CACHE),
      ]);
      const [oldPayload, oldMetadata] = await Promise.all([
        payloadCache.match(key.payload), metadataCache.match(key.metadata),
      ]);
      try {
        await payloadCache.put(key.payload, new ResponseCtor(bytes.slice(0), { headers: { 'content-type': 'audio/mpeg' } }));
        await metadataCache.put(key.metadata, new ResponseCtor(JSON.stringify(record), { headers: { 'content-type': 'application/json' } }));
      } catch (error) {
        if (oldPayload) await payloadCache.put(key.payload, oldPayload);
        else await payloadCache.delete(key.payload);
        if (oldMetadata) await metadataCache.put(key.metadata, oldMetadata);
        else await metadataCache.delete(key.metadata);
        throw error;
      }
    },

    async removeInstalled(translationId: string, segmentId: string) {
      await deleteBoth(translationId, segmentId);
    },

    async usage() {
      const records = await repository.listInstalled();
      return Object.freeze({
        bytes: records.reduce((sum, row) => sum + row.bytes, 0),
        packages: records.length,
      });
    },
  });
  return repository;
}

export function createFetchScriptureAudioPackageTransport(input: {
  readonly fetcher?: typeof fetch;
  readonly maxBytes?: number;
} = {}): ScriptureAudioPackageTransport {
  const fetcher = input.fetcher ?? globalThis.fetch;
  if (typeof fetcher !== 'function') throw new Error('Audio package transport requires fetch().');
  const maxBytes = input.maxBytes ?? V6_AUDIO_SEGMENT_MAX_BYTES;
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > V6_AUDIO_SEGMENT_MAX_BYTES) {
    throw new Error(`Audio transport byte limit must be from 1 to ${V6_AUDIO_SEGMENT_MAX_BYTES}.`);
  }
  return Object.freeze({
    async download(url: string, { signal, onProgress }: { signal: AbortSignal; onProgress?: (receivedBytes: number, totalBytes?: number) => void }) {
      let parsedUrl: URL;
      try { parsedUrl = new URL(url); }
      catch { throw new Error('Audio package URL is invalid.'); }
      if (parsedUrl.protocol !== 'https:' || parsedUrl.username || parsedUrl.password) throw new Error('Audio package URL must be credential-free HTTPS.');
      let response: Response;
      try {
        response = await fetcher(url, { signal, cache: 'no-store', credentials: 'omit', redirect: 'error' });
      } catch (error) {
        if (signal.aborted || (error instanceof Error && error.name === 'AbortError')) throw error;
        throw new AudioPackageDownloadUnavailableError();
      }
      if (!response.ok) throw new AudioPackageDownloadUnavailableError(`Offline audio download is unavailable from this source in this browser (HTTP ${response.status}). Direct streaming remains usable.`);
      const headerBytes = Number(response.headers.get('content-length'));
      const total = Number.isFinite(headerBytes) && headerBytes > 0 ? headerBytes : undefined;
      if (total !== undefined && total > maxBytes) throw new Error('Audio package response exceeds the configured size limit.');
      if (!response.body?.getReader) {
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength > maxBytes) throw new Error('Audio package response exceeds the configured size limit.');
        onProgress?.(bytes.byteLength, total ?? bytes.byteLength);
        return bytes;
      }
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value?.byteLength) {
          chunks.push(value);
          received += value.byteLength;
          if (received > maxBytes) {
            await reader.cancel();
            throw new Error('Audio package response exceeds the configured size limit.');
          }
          onProgress?.(received, total);
        }
      }
      const output = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.byteLength; }
      onProgress?.(received, total ?? received);
      return output.buffer;
    },
  });
}

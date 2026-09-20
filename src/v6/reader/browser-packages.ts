import {
  ScripturePackageManager,
  packageForBook,
  type InstalledScripturePackage,
  type ScripturePackageProgress,
  type ScripturePackageRepository,
  type ScripturePackageTransport,
  type ScripturePackageUsage,
} from './package-manager.ts';
import {
  validateScriptureManifest,
  type ScriptureTranslationManifest,
} from './content-manifest.ts';
import { translationPackagingPolicy } from './license-policy.ts';

const PAYLOAD_CACHE = 'biblequest-v3-opened-bible-packs-v1';
const METADATA_CACHE = 'biblequest-v6-scripture-package-metadata-v1';
const TRANSLATION_FOLDERS = Object.freeze<Record<string, string>>({
  bsb: 'bible',
  tl: 'tagalog',
  cebocb: 'cebuano',
});

export interface BrowserScripturePackageSnapshot {
  readonly supported: boolean;
  readonly downloadable: boolean;
  readonly translationId: string;
  readonly bookCode: string;
  readonly installed: InstalledScripturePackage | null;
  readonly packageBytes: number | null;
  readonly usage: ScripturePackageUsage;
  readonly reason: string;
}

export interface BrowserScripturePackageController {
  snapshot(translationId: string, bookCode: string): Promise<BrowserScripturePackageSnapshot>;
  install(
    translationId: string,
    bookCode: string,
    onProgress?: (progress: ScripturePackageProgress) => void,
  ): ReturnType<ScripturePackageManager['install']>;
  cancel(translationId: string, bookCode: string): boolean;
  remove(translationId: string, bookCode: string): Promise<void>;
}

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeBookCode(value: unknown): string {
  const code = clean(value).toUpperCase();
  if (!code) throw new Error('Book code is required.');
  return code;
}

function folderFor(translationId: string): string {
  const folder = TRANSLATION_FOLDERS[translationId];
  if (!folder) throw new Error(`Offline packages are not configured for ${translationId || 'this translation'}.`);
  return folder;
}

function relativePayloadPath(translationId: string, bookCode: string): string {
  return `data/packs/${folderFor(translationId)}/${normalizeBookCode(bookCode)}.json`;
}

function absoluteUrl(path: string, locationRef: Location): string {
  return new URL(path, locationRef.href).href;
}

function metadataUrl(translationId: string, bookCode: string, locationRef: Location): string {
  const origin = new URL(locationRef.href).origin;
  return new URL(
    `/__bq_v6_scripture_packages__/${encodeURIComponent(translationId)}/${encodeURIComponent(normalizeBookCode(bookCode))}.json`,
    origin,
  ).href;
}

export function createBrowserScripturePackageRepository({
  cacheStorage = globalThis.caches,
  ResponseCtor = globalThis.Response,
  locationRef = globalThis.location,
}: {
  cacheStorage?: CacheStorage;
  ResponseCtor?: typeof Response;
  locationRef?: Location;
} = {}): ScripturePackageRepository {
  if (!cacheStorage?.open || typeof ResponseCtor !== 'function' || !locationRef?.href) {
    throw new Error('Managed offline Scripture storage is not supported on this device.');
  }

  const payloadKey = (translationId: string, bookCode: string) =>
    absoluteUrl(relativePayloadPath(translationId, bookCode), locationRef);
  const metadataKey = (translationId: string, bookCode: string) =>
    metadataUrl(translationId, bookCode, locationRef);

  return Object.freeze({
    async readInstalled(translationId, bookCode) {
      const metadataCache = await cacheStorage.open(METADATA_CACHE);
      const response = await metadataCache.match(metadataKey(translationId, bookCode));
      if (!response) return null;
      try {
        const record = await response.json() as InstalledScripturePackage;
        if (
          clean(record?.translationId) !== clean(translationId)
          || normalizeBookCode(record?.bookCode) !== normalizeBookCode(bookCode)
        ) {
          await metadataCache.delete(metadataKey(translationId, bookCode));
          return null;
        }
        const payloadCache = await cacheStorage.open(PAYLOAD_CACHE);
        if (!(await payloadCache.match(payloadKey(translationId, bookCode)))) {
          await metadataCache.delete(metadataKey(translationId, bookCode));
          return null;
        }
        return Object.freeze({ ...record });
      } catch {
        await metadataCache.delete(metadataKey(translationId, bookCode));
        return null;
      }
    },

    async replaceInstalled(record, payload) {
      const payloadCache = await cacheStorage.open(PAYLOAD_CACHE);
      const metadataCache = await cacheStorage.open(METADATA_CACHE);
      const bodyKey = payloadKey(record.translationId, record.bookCode);
      const metaKey = metadataKey(record.translationId, record.bookCode);
      const previousPayload = await payloadCache.match(bodyKey);
      const previousMetadata = await metadataCache.match(metaKey);

      try {
        await payloadCache.put(
          bodyKey,
          new ResponseCtor(payload.slice(0), { headers: { 'content-type': 'application/json; charset=utf-8' } }),
        );
        await metadataCache.put(
          metaKey,
          new ResponseCtor(JSON.stringify(record), { headers: { 'content-type': 'application/json; charset=utf-8' } }),
        );
      } catch (error) {
        if (previousPayload) await payloadCache.put(bodyKey, previousPayload);
        else await payloadCache.delete(bodyKey);
        if (previousMetadata) await metadataCache.put(metaKey, previousMetadata);
        else await metadataCache.delete(metaKey);
        throw error;
      }
    },

    async removeInstalled(translationId, bookCode) {
      const payloadCache = await cacheStorage.open(PAYLOAD_CACHE);
      const metadataCache = await cacheStorage.open(METADATA_CACHE);
      await Promise.all([
        payloadCache.delete(payloadKey(translationId, bookCode)),
        metadataCache.delete(metadataKey(translationId, bookCode)),
      ]);
    },

    async usage() {
      const metadataCache = await cacheStorage.open(METADATA_CACHE);
      const keys = await metadataCache.keys();
      let bytes = 0;
      let packages = 0;
      for (const request of keys) {
        const response = await metadataCache.match(request);
        if (!response) continue;
        try {
          const record = await response.json() as InstalledScripturePackage;
          if (!Number.isFinite(record?.bytes) || record.bytes < 0) continue;
          bytes += record.bytes;
          packages += 1;
        } catch {
          await metadataCache.delete(request);
        }
      }
      return Object.freeze({ bytes, packages });
    },
  });
}

export function createFetchScripturePackageTransport({
  fetcher = globalThis.fetch,
}: {
  fetcher?: typeof fetch;
} = {}): ScripturePackageTransport {
  if (typeof fetcher !== 'function') throw new Error('Scripture package transport requires fetch().');

  return Object.freeze({
    async download(url, { signal, onProgress }) {
      const response = await fetcher(url, { signal, cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) throw new Error(`Scripture package request failed with HTTP ${response.status}.`);

      const headerBytes = Number(response.headers.get('content-length'));
      const declaredTotal = Number.isFinite(headerBytes) && headerBytes > 0 ? headerBytes : undefined;
      if (!response.body?.getReader) {
        const buffer = await response.arrayBuffer();
        onProgress?.(buffer.byteLength, declaredTotal ?? buffer.byteLength);
        return buffer;
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
          onProgress?.(received, declaredTotal);
        }
      }

      const output = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        output.set(chunk, offset);
        offset += chunk.byteLength;
      }
      onProgress?.(received, declaredTotal ?? received);
      return output.buffer;
    },
  });
}

export function createBrowserScripturePackageController({
  repository = createBrowserScripturePackageRepository(),
  transport = createFetchScripturePackageTransport(),
  fetcher = globalThis.fetch,
  manifestBase = 'data/v6-scripture-manifests',
}: {
  repository?: ScripturePackageRepository;
  transport?: ScripturePackageTransport;
  fetcher?: typeof fetch;
  manifestBase?: string;
} = {}): BrowserScripturePackageController {
  const manager = new ScripturePackageManager(repository, transport);
  const manifestCache = new Map<string, Promise<ScriptureTranslationManifest>>();

  const loadManifest = async (translationId: string): Promise<ScriptureTranslationManifest> => {
    const id = clean(translationId);
    if (!manifestCache.has(id)) {
      manifestCache.set(id, (async () => {
        const response = await fetcher(`${manifestBase}/${encodeURIComponent(id)}.json`, {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        if (!response.ok) throw new Error(`Offline package manifest is unavailable for ${id}.`);
        const manifest = await response.json() as ScriptureTranslationManifest;
        const validation = validateScriptureManifest(manifest);
        if (!validation.valid || manifest.translationId !== id) {
          throw new Error(`Offline package manifest is invalid for ${id}.`);
        }
        return Object.freeze(manifest);
      })());
    }
    try {
      return await manifestCache.get(id)!;
    } catch (error) {
      manifestCache.delete(id);
      throw error;
    }
  };

  return Object.freeze({
    async snapshot(translationId, bookCode) {
      const id = clean(translationId);
      const code = normalizeBookCode(bookCode);
      const policy = translationPackagingPolicy(id);
      const usage = await manager.usage().catch(() => ({ bytes: 0, packages: 0 }));
      if (!policy || policy.delivery !== 'downloadable' || policy.license.redistribution !== 'allowed') {
        return Object.freeze({
          supported: true,
          downloadable: false,
          translationId: id,
          bookCode: code,
          installed: null,
          packageBytes: null,
          usage,
          reason: policy?.delivery === 'external'
            ? 'This translation stays in its licensed external reader.'
            : 'This translation is not approved for offline packaging.',
        });
      }

      const installed = await manager.installed(id, code).catch(() => null);
      try {
        const manifest = await loadManifest(id);
        const book = packageForBook(manifest, code);
        return Object.freeze({
          supported: true,
          downloadable: Boolean(book),
          translationId: id,
          bookCode: code,
          installed,
          packageBytes: book?.bytes ?? installed?.bytes ?? null,
          usage,
          reason: installed
            ? 'Managed offline copy installed and verified.'
            : book
              ? 'Download a verified copy of this book for offline use.'
              : 'No offline package is declared for this book.',
        });
      } catch (error) {
        return Object.freeze({
          supported: true,
          downloadable: Boolean(installed),
          translationId: id,
          bookCode: code,
          installed,
          packageBytes: installed?.bytes ?? null,
          usage,
          reason: installed
            ? 'Managed offline copy installed. Reconnect to check for package updates.'
            : String((error as Error)?.message || 'Reconnect to load offline package details.'),
        });
      }
    },

    async install(translationId, bookCode, onProgress) {
      const manifest = await loadManifest(clean(translationId));
      return manager.install(manifest, normalizeBookCode(bookCode), { onProgress });
    },

    cancel(translationId, bookCode) {
      return manager.cancel(clean(translationId), normalizeBookCode(bookCode));
    },

    async remove(translationId, bookCode) {
      await manager.remove(clean(translationId), normalizeBookCode(bookCode));
    },
  });
}

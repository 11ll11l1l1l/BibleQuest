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
  verifyPackageChecksum,
  type ScriptureTranslationManifest,
} from './content-manifest.ts';
import { translationPackagingPolicy } from './license-policy.ts';
import { fullTranslationOfflineEligibility } from './full-translation-offline.ts';
import { OfflineScriptureSearch } from './offline-search.ts';
import type { ReaderBookRef, ReaderSearchResult, ReaderTranslationId } from './contracts.ts';
import {
  SCRIPTURE_PACKAGE_METADATA_CACHE_NAME,
  SCRIPTURE_PACKAGE_PAYLOAD_CACHE_NAME,
  scripturePackageMetadataUrl,
} from './package-storage.ts';

const PAYLOAD_CACHE = SCRIPTURE_PACKAGE_PAYLOAD_CACHE_NAME;
const METADATA_CACHE = SCRIPTURE_PACKAGE_METADATA_CACHE_NAME;
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
  /** An installed book is readable, but its manifest declares newer bytes. */
  readonly updateAvailable: boolean;
  readonly packageBytes: number | null;
  readonly usage: ScripturePackageUsage;
  readonly reason: string;
}

export interface BrowserScripturePackageController {
  searchOfflineText(translationId: ReaderTranslationId, query: string, limit?: number): Promise<ReaderSearchResult>;
  snapshot(translationId: string, bookCode: string): Promise<BrowserScripturePackageSnapshot>;
  listInstalled(): Promise<readonly InstalledScripturePackage[]>;
  translationSnapshot(translationId: string): Promise<BrowserScriptureTranslationSnapshot>;
  installTranslation(
    translationId: string,
    onProgress?: (progress: BrowserScriptureTranslationProgress) => void,
  ): Promise<BrowserScriptureTranslationSnapshot>;
  cancelTranslation(translationId: string): boolean;
  removeTranslation(translationId: string): Promise<void>;
  install(
    translationId: string,
    bookCode: string,
    onProgress?: (progress: ScripturePackageProgress) => void,
  ): ReturnType<ScripturePackageManager['install']>;
  cancel(translationId: string, bookCode: string): boolean;
  remove(translationId: string, bookCode: string): Promise<void>;
}

export interface BrowserScriptureTranslationSnapshot {
  readonly translationId: string;
  readonly downloadable: boolean;
  readonly totalBooks: number;
  readonly totalBytes: number | null;
  readonly installedBooks: number;
  readonly installedBytes: number;
  readonly reason: string;
}

export interface BrowserScriptureTranslationProgress {
  readonly translationId: string;
  readonly currentBookCode: string;
  readonly completedBooks: number;
  readonly totalBooks: number;
  readonly completedBytes: number;
  readonly receivedBytes: number;
  readonly totalBytes: number | null;
  readonly ratio: number | null;
  readonly phase: ScripturePackageProgress['phase'] | 'complete';
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
  return scripturePackageMetadataUrl(translationId, normalizeBookCode(bookCode), locationRef.href);
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

  const repository: ScripturePackageRepository = Object.freeze({
    async readInstalled(translationId: string, bookCode: string) {
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
        const payload = await payloadCache.match(payloadKey(translationId, bookCode));
        if (!payload) {
          await metadataCache.delete(metadataKey(translationId, bookCode));
          return null;
        }
        const bytes = await payload.clone().arrayBuffer();
        if (bytes.byteLength !== record.bytes || !(await verifyPackageChecksum(bytes, record.sha256))) {
          await Promise.all([
            metadataCache.delete(metadataKey(translationId, bookCode)),
            payloadCache.delete(payloadKey(translationId, bookCode)),
          ]);
          return null;
        }
        return Object.freeze({ ...record });
      } catch {
        await metadataCache.delete(metadataKey(translationId, bookCode));
        return null;
      }
    },

    async readInstalledPayload(translationId: string, bookCode: string) {
      const record = await repository.readInstalled(translationId, bookCode);
      if (!record) return null;
      const payloadCache = await cacheStorage.open(PAYLOAD_CACHE);
      const payload = await payloadCache.match(payloadKey(translationId, bookCode));
      if (!payload) return null;
      const bytes = await payload.arrayBuffer();
      if (bytes.byteLength !== record.bytes || !(await verifyPackageChecksum(bytes, record.sha256))) return null;
      return bytes;
    },

    async listInstalled() {
      const metadataCache = await cacheStorage.open(METADATA_CACHE);
      const keys = await metadataCache.keys();
      const identities = new Map<string, Readonly<{ translationId: string; bookCode: string }>>();
      for (const request of keys) {
        try {
          const url = new URL(request.url);
          const prefix = '/__bq_v6_scripture_packages__/';
          if (!url.pathname.startsWith(prefix)) continue;
          const parts = url.pathname.slice(prefix.length).split('/');
          if (parts.length !== 2 || !parts[1].endsWith('.json')) continue;
          const translationId = decodeURIComponent(parts[0]);
          const bookCode = normalizeBookCode(decodeURIComponent(parts[1].slice(0, -5)));
          if (!TRANSLATION_FOLDERS[translationId] || !/^(?:[1-3])?[A-Z]{2,3}$/.test(bookCode)) continue;
          identities.set(`${translationId}:${bookCode}`, Object.freeze({ translationId, bookCode }));
        } catch { /* Ignore malformed metadata cache keys. */ }
      }
      const installed = await Promise.all([...identities.values()].map(async ({ translationId, bookCode }) => {
        try { return await repository.readInstalled(translationId, bookCode); }
        catch { return null; }
      }));
      return Object.freeze(installed.filter((record): record is InstalledScripturePackage => record !== null));
    },

    async replaceInstalled(record: InstalledScripturePackage, payload: ArrayBuffer) {
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

    async removeInstalled(translationId: string, bookCode: string) {
      const payloadCache = await cacheStorage.open(PAYLOAD_CACHE);
      const metadataCache = await cacheStorage.open(METADATA_CACHE);
      await Promise.all([
        payloadCache.delete(payloadKey(translationId, bookCode)),
        metadataCache.delete(metadataKey(translationId, bookCode)),
      ]);
    },

    async usage() {
      const installed = await repository.listInstalled();
      return Object.freeze({
        bytes: installed.reduce((total, record) => total + record.bytes, 0),
        packages: installed.length,
      });
    },
  });
  return repository;
}

export function createFetchScripturePackageTransport({
  fetcher = globalThis.fetch,
}: {
  fetcher?: typeof fetch;
} = {}): ScripturePackageTransport {
  if (typeof fetcher !== 'function') throw new Error('Scripture package transport requires fetch().');

  return Object.freeze({
    async download(url: string, { signal, onProgress }: { signal: AbortSignal; onProgress?: (receivedBytes: number, totalBytes?: number) => void }) {
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
  books = [],
}: {
  repository?: ScripturePackageRepository;
  transport?: ScripturePackageTransport;
  fetcher?: typeof fetch;
  manifestBase?: string;
  books?: readonly ReaderBookRef[];
} = {}): BrowserScripturePackageController {
  const manager = new ScripturePackageManager(repository, transport);
  const manifestCache = new Map<string, Promise<ScriptureTranslationManifest>>();
  const activeTranslations = new Map<string, AbortController>();
  const offlineSearch = new OfflineScriptureSearch({
    listInstalled: () => manager.listInstalled(),
    readInstalledPayload: async (translationId, bookCode) => repository.readInstalledPayload
      ? repository.readInstalledPayload(translationId, bookCode)
      : null,
  }, books);

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

  const translationSnapshot = async (translationId: string): Promise<BrowserScriptureTranslationSnapshot> => {
    const id = clean(translationId);
    const policy = translationPackagingPolicy(id);
    if (!policy || policy.delivery !== 'downloadable' || policy.license.redistribution !== 'allowed') {
      return Object.freeze({
        translationId: id,
        downloadable: false,
        totalBooks: 0,
        totalBytes: null,
        installedBooks: 0,
        installedBytes: 0,
        reason: policy?.delivery === 'external'
          ? 'This translation stays in its licensed external reader.'
          : 'This translation is not approved for offline packaging.',
      });
    }
    const manifest = await loadManifest(id);
    const eligibility = fullTranslationOfflineEligibility(
      manifest,
      manifest.books.map(book => ({ code: book.bookCode, path: book.url })),
    );
    const installed = (await manager.listInstalled()).filter(row => row.translationId === id);
    const installedBytes = installed.reduce((sum, row) => sum + row.bytes, 0);
    const currentBooks = installed.filter(row => {
      const book = packageForBook(manifest, row.bookCode);
      return Boolean(book && row.contentVersion === manifest.contentVersion
        && row.sha256.toLowerCase() === book.sha256.toLowerCase());
    }).length;
    const totalBytes = manifest.books.every(book => Number.isFinite(book.bytes) && Number(book.bytes) >= 0)
      ? manifest.books.reduce((sum, book) => sum + Number(book.bytes), 0)
      : null;
    return Object.freeze({
      translationId: id,
      downloadable: eligibility.eligible,
      totalBooks: manifest.books.length,
      totalBytes,
      installedBooks: currentBooks,
      installedBytes,
      reason: !eligibility.eligible
        ? `Full translation offline download is unavailable: ${eligibility.reason}.`
        : currentBooks === manifest.books.length
        ? 'Full translation is installed and verified.'
        : `${currentBooks} of ${manifest.books.length} books installed and verified.`,
    });
  };

  return Object.freeze({
    searchOfflineText(translationId: ReaderTranslationId, query: string, limit?: number) {
      return offlineSearch.searchText(translationId, query, limit);
    },
    async listInstalled() {
      return manager.listInstalled();
    },
    async translationSnapshot(translationId: string) {
      return translationSnapshot(translationId);
    },
    async installTranslation(translationId: string, onProgress?: (progress: BrowserScriptureTranslationProgress) => void) {
      const id = clean(translationId);
      if (activeTranslations.has(id)) throw new Error(`A full-translation download is already active for ${id}.`);
      const policy = translationPackagingPolicy(id);
      if (!policy || policy.delivery !== 'downloadable' || policy.license.redistribution !== 'allowed') {
        throw new Error('This translation is not approved for offline packaging.');
      }
      const controller = new AbortController();
      activeTranslations.set(id, controller);
      try {
        const manifest = await loadManifest(id);
        const eligibility = fullTranslationOfflineEligibility(
          manifest,
          manifest.books.map(book => ({ code: book.bookCode, path: book.url })),
        );
        if (!eligibility.eligible) {
          throw new Error(`Full ${id.toUpperCase()} offline download is blocked: ${eligibility.reason}.`);
        }
        const totalBytes = manifest.books.every(book => Number.isFinite(book.bytes) && Number(book.bytes) >= 0)
          ? manifest.books.reduce((sum, book) => sum + Number(book.bytes), 0)
          : null;
        let completedBooks = 0;
        let completedBytes = 0;
        for (const book of manifest.books) {
          if (controller.signal.aborted) {
            const error = new Error('Full Scripture translation download cancelled.');
            error.name = 'AbortError';
            throw error;
          }
          const baseBytes = completedBytes;
          const result = await manager.install(manifest, book.bookCode, {
            signal: controller.signal,
            onProgress: progress => {
              const receivedBytes = Math.min(progress.receivedBytes, Number(book.bytes) || progress.receivedBytes);
              onProgress?.(Object.freeze({
                translationId: id,
                currentBookCode: book.bookCode,
                completedBooks,
                totalBooks: manifest.books.length,
                completedBytes: baseBytes,
                receivedBytes,
                totalBytes,
                ratio: totalBytes && totalBytes > 0 ? Math.min(1, (baseBytes + receivedBytes) / totalBytes) : null,
                phase: progress.phase,
              }));
            },
          });
          completedBooks += 1;
          completedBytes += Number(book.bytes ?? result.package.bytes);
          onProgress?.(Object.freeze({
            translationId: id,
            currentBookCode: book.bookCode,
            completedBooks,
            totalBooks: manifest.books.length,
            completedBytes,
            receivedBytes: 0,
            totalBytes,
            ratio: totalBytes && totalBytes > 0 ? Math.min(1, completedBytes / totalBytes) : null,
            phase: completedBooks === manifest.books.length ? 'complete' : 'storing',
          }));
        }
        return await translationSnapshot(id);
      } finally {
        if (activeTranslations.get(id) === controller) activeTranslations.delete(id);
      }
    },
    cancelTranslation(translationId: string) {
      const controller = activeTranslations.get(clean(translationId));
      if (!controller) return false;
      controller.abort();
      return true;
    },
    async removeTranslation(translationId: string) {
      const id = clean(translationId);
      if (activeTranslations.has(id)) throw new Error('Cancel the active full-translation download before removing it.');
      const installed = (await manager.listInstalled()).filter(row => row.translationId === id);
      for (const row of installed) await manager.remove(id, row.bookCode);
    },
    async snapshot(translationId: string, bookCode: string) {
      const id = clean(translationId);
      const code = normalizeBookCode(bookCode);
      const policy = translationPackagingPolicy(id);
      const usage = async (): Promise<ScripturePackageUsage> => {
        const installed = await manager.listInstalled();
        return Object.freeze({
          bytes: installed.reduce((total, record) => total + record.bytes, 0),
          packages: installed.length,
        });
      };
      if (!policy || policy.delivery !== 'downloadable' || policy.license.redistribution !== 'allowed') {
        return Object.freeze({
          supported: true,
          downloadable: false,
          translationId: id,
          bookCode: code,
          installed: null,
          updateAvailable: false,
          packageBytes: null,
          usage: await usage().catch(() => ({ bytes: 0, packages: 0 })),
          reason: policy?.delivery === 'external'
            ? 'This translation stays in its licensed external reader.'
            : 'This translation is not approved for offline packaging.',
        });
      }

        const [installed, verifiedUsage] = await Promise.all([
          manager.installed(id, code).catch(() => null),
          usage().catch(() => ({ bytes: 0, packages: 0 })),
        ]);
      try {
        const manifest = await loadManifest(id);
        const book = packageForBook(manifest, code);
        const updateAvailable = Boolean(installed && book
          && (installed.sha256.toLowerCase() !== book.sha256.toLowerCase()
            || installed.contentVersion !== manifest.contentVersion));
        return Object.freeze({
          supported: true,
          downloadable: Boolean(book),
          translationId: id,
          bookCode: code,
          installed,
          updateAvailable,
          packageBytes: book?.bytes ?? installed?.bytes ?? null,
          usage: verifiedUsage,
          reason: updateAvailable
            ? 'A verified update is ready for this offline book.'
            : installed
              ? 'Managed offline copy installed and verified.'
            : book
              ? 'Download a verified copy of this book for offline use.'
              : 'No offline package is declared for this book.',
        });
      } catch (error) {
        return Object.freeze({
          supported: true,
          downloadable: true,
          translationId: id,
          bookCode: code,
          installed,
          updateAvailable: false,
          packageBytes: installed?.bytes ?? null,
          usage: await usage().catch(() => ({ bytes: 0, packages: 0 })),
          reason: installed
            ? 'Managed offline copy installed. Reconnect to check for package updates.'
            : String((error as Error)?.message || 'Reconnect to load offline package details.'),
        });
      }
    },

    async install(translationId: string, bookCode: string, onProgress?: (progress: ScripturePackageProgress) => void) {
      const manifest = await loadManifest(clean(translationId));
      return manager.install(manifest, normalizeBookCode(bookCode), { onProgress });
    },

    cancel(translationId: string, bookCode: string) {
      return manager.cancel(clean(translationId), normalizeBookCode(bookCode));
    },

    async remove(translationId: string, bookCode: string) {
      await manager.remove(clean(translationId), normalizeBookCode(bookCode));
    },
  });
}

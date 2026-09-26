import {
  assertScriptureDownloadAllowed,
  packageNeedsUpdate,
  scripturePackageKey,
  verifyPackageChecksum,
  type ScriptureBookPackage,
  type ScriptureTranslationManifest,
} from './content-manifest.ts';

export const SCRIPTURE_OFFLINE_STORAGE_CEILING_BYTES = 10_000_000_000;

export type ScripturePackagePhase = 'downloading' | 'verifying' | 'storing';

export interface ScripturePackageProgress {
  readonly phase: ScripturePackagePhase;
  readonly translationId: string;
  readonly bookCode: string;
  readonly receivedBytes: number;
  readonly totalBytes: number | null;
  readonly ratio: number | null;
}

export interface InstalledScripturePackage {
  readonly key: string;
  readonly translationId: string;
  readonly contentVersion: string;
  readonly bookCode: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly installedAt: string;
}

export interface ScripturePackageUsage {
  readonly bytes: number;
  readonly packages: number;
}

export interface ScripturePackageRepository {
  readInstalled(translationId: string, bookCode: string): Promise<InstalledScripturePackage | null>;
  replaceInstalled(record: InstalledScripturePackage, payload: ArrayBuffer): Promise<void>;
  removeInstalled(translationId: string, bookCode: string): Promise<void>;
  usage(): Promise<ScripturePackageUsage>;
}

export interface ScripturePackageTransport {
  download(
    url: string,
    options: Readonly<{
      signal: AbortSignal;
      onProgress?: (receivedBytes: number, totalBytes?: number) => void;
    }>,
  ): Promise<ArrayBuffer>;
}

export type ScripturePackageInstallResult =
  | Readonly<{ status: 'current'; package: InstalledScripturePackage }>
  | Readonly<{ status: 'installed'; package: InstalledScripturePackage }>;

export class ScripturePackageIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScripturePackageIntegrityError';
  }
}

export class ScripturePackageStorageLimitError extends Error {
  readonly projectedBytes: number;
  readonly ceilingBytes: number;

  constructor(projectedBytes: number, ceilingBytes = SCRIPTURE_OFFLINE_STORAGE_CEILING_BYTES) {
    super(`Scripture offline storage would reach ${projectedBytes} bytes; packages must remain below the ${ceilingBytes}-byte ceiling.`);
    this.name = 'ScripturePackageStorageLimitError';
    this.projectedBytes = projectedBytes;
    this.ceilingBytes = ceilingBytes;
  }
}

function normalizedBookCode(bookCode: string): string {
  const value = String(bookCode ?? '').trim().toUpperCase();
  if (!value) throw new Error('Book code is required.');
  return value;
}

function operationKey(translationId: string, bookCode: string): string {
  return `${String(translationId ?? '').trim()}:${normalizedBookCode(bookCode)}`;
}

function boundedProgress(receivedBytes: number, totalBytes?: number): Readonly<{
  receivedBytes: number;
  totalBytes: number | null;
  ratio: number | null;
}> {
  const received = Number.isFinite(receivedBytes) && receivedBytes >= 0 ? Math.floor(receivedBytes) : 0;
  const total = Number.isFinite(totalBytes) && Number(totalBytes) > 0 ? Math.floor(Number(totalBytes)) : null;
  const ratio = total === null ? null : Math.max(0, Math.min(1, received / total));
  return Object.freeze({ receivedBytes: received, totalBytes: total, ratio });
}

function abortError(): Error {
  const error = new Error('Scripture package download cancelled.');
  error.name = 'AbortError';
  return error;
}

function projectedUsageBytes(usage: ScripturePackageUsage, current: InstalledScripturePackage | null, replacementBytes: number): number {
  const installedBytes = Number.isFinite(usage.bytes) && usage.bytes >= 0 ? Math.floor(usage.bytes) : 0;
  const replacedBytes = current && Number.isFinite(current.bytes) && current.bytes >= 0 ? Math.floor(current.bytes) : 0;
  return Math.max(0, installedBytes - replacedBytes) + replacementBytes;
}

function assertBelowStorageCeiling(usage: ScripturePackageUsage, current: InstalledScripturePackage | null, replacementBytes: number): void {
  const projectedBytes = projectedUsageBytes(usage, current, replacementBytes);
  if (projectedBytes >= SCRIPTURE_OFFLINE_STORAGE_CEILING_BYTES) {
    throw new ScripturePackageStorageLimitError(projectedBytes);
  }
}

export class ScripturePackageManager {
  readonly #repository: ScripturePackageRepository;
  readonly #transport: ScripturePackageTransport;
  readonly #now: () => string;
  readonly #active = new Map<string, AbortController>();

  constructor(
    repository: ScripturePackageRepository,
    transport: ScripturePackageTransport,
    now: () => string = () => new Date().toISOString(),
  ) {
    this.#repository = repository;
    this.#transport = transport;
    this.#now = now;
  }

  async installed(translationId: string, bookCode: string): Promise<InstalledScripturePackage | null> {
    return this.#repository.readInstalled(String(translationId ?? '').trim(), normalizedBookCode(bookCode));
  }

  async usage(): Promise<ScripturePackageUsage> {
    return this.#repository.usage();
  }

  async remove(translationId: string, bookCode: string): Promise<void> {
    const key = operationKey(translationId, bookCode);
    if (this.#active.has(key)) throw new Error('Cancel the active Scripture download before removing this package.');
    await this.#repository.removeInstalled(String(translationId ?? '').trim(), normalizedBookCode(bookCode));
  }

  cancel(translationId: string, bookCode: string): boolean {
    const controller = this.#active.get(operationKey(translationId, bookCode));
    if (!controller) return false;
    controller.abort();
    return true;
  }

  async install(
    manifest: ScriptureTranslationManifest,
    bookCode: string,
    options: Readonly<{
      signal?: AbortSignal;
      onProgress?: (progress: ScripturePackageProgress) => void;
    }> = {},
  ): Promise<ScripturePackageInstallResult> {
    assertScriptureDownloadAllowed(manifest);
    const normalizedCode = normalizedBookCode(bookCode);
    const book = manifest.books.find((candidate) => candidate.bookCode.toUpperCase() === normalizedCode);
    if (!book) throw new Error(`No offline package is declared for ${normalizedCode}.`);

    const current = await this.#repository.readInstalled(manifest.translationId, normalizedCode);
    if (!packageNeedsUpdate(current, book) && current) {
      return Object.freeze({ status: 'current' as const, package: current });
    }

    // Known-size packages fail before transport. Unknown-size packages are checked again
    // against their verified payload before any persistent replacement occurs.
    if (book.bytes !== undefined) {
      assertBelowStorageCeiling(await this.#repository.usage(), current, book.bytes);
    }

    const key = operationKey(manifest.translationId, normalizedCode);
    if (this.#active.has(key)) throw new Error(`A Scripture package operation is already active for ${normalizedCode}.`);

    const controller = new AbortController();
    const externalSignal = options.signal;
    const propagateAbort = () => controller.abort();
    if (externalSignal?.aborted) controller.abort();
    else externalSignal?.addEventListener('abort', propagateAbort, { once: true });
    this.#active.set(key, controller);

    const emit = (
      phase: ScripturePackagePhase,
      receivedBytes: number,
      totalBytes?: number,
    ) => {
      const progress = boundedProgress(receivedBytes, totalBytes);
      options.onProgress?.(Object.freeze({
        phase,
        translationId: manifest.translationId,
        bookCode: normalizedCode,
        ...progress,
      }));
    };

    try {
      if (controller.signal.aborted) throw abortError();
      emit('downloading', 0, book.bytes);

      const payload = await this.#transport.download(book.url, {
        signal: controller.signal,
        onProgress: (receivedBytes, totalBytes) => emit('downloading', receivedBytes, totalBytes ?? book.bytes),
      });

      if (controller.signal.aborted) throw abortError();
      if (book.bytes !== undefined && payload.byteLength !== book.bytes) {
        throw new ScripturePackageIntegrityError(
          `Scripture package size mismatch for ${normalizedCode}: expected ${book.bytes}, received ${payload.byteLength}.`,
        );
      }

      emit('verifying', payload.byteLength, book.bytes ?? payload.byteLength);
      const checksumValid = await verifyPackageChecksum(payload, book.sha256);
      if (!checksumValid) {
        throw new ScripturePackageIntegrityError(`Scripture package checksum mismatch for ${normalizedCode}.`);
      }
      if (controller.signal.aborted) throw abortError();

      // Re-read usage immediately before storage so another completed package operation
      // cannot make an earlier preflight budget decision stale.
      assertBelowStorageCeiling(await this.#repository.usage(), current, payload.byteLength);

      const record = Object.freeze({
        key: scripturePackageKey(manifest, book),
        translationId: manifest.translationId,
        contentVersion: manifest.contentVersion,
        bookCode: normalizedCode,
        sha256: book.sha256.toLowerCase(),
        bytes: payload.byteLength,
        installedAt: this.#now(),
      });

      emit('storing', payload.byteLength, payload.byteLength);
      await this.#repository.replaceInstalled(record, payload.slice(0));
      return Object.freeze({ status: 'installed' as const, package: record });
    } finally {
      externalSignal?.removeEventListener('abort', propagateAbort);
      if (this.#active.get(key) === controller) this.#active.delete(key);
    }
  }
}

export function packageForBook(
  manifest: ScriptureTranslationManifest,
  bookCode: string,
): ScriptureBookPackage | null {
  const normalizedCode = normalizedBookCode(bookCode);
  return manifest.books.find((book) => book.bookCode.toUpperCase() === normalizedCode) ?? null;
}

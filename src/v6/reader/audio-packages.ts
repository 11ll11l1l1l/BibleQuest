import {
  audioOfflineEligibility,
  V6_READER_AUDIO_STORAGE_CEILING_BYTES,
  type ScriptureAudioManifest,
  type ScriptureAudioSegment,
} from './audio-policy.ts';
import { verifyPackageChecksum } from './content-manifest.ts';

export interface InstalledScriptureAudioPackage {
  readonly translationId: string;
  readonly audioContentVersion: string;
  readonly scriptureContentVersion: string;
  readonly segmentId: string;
  readonly book: string;
  readonly chapter: number;
  readonly sha256: string;
  readonly bytes: number;
  readonly installedAt: string;
}

export interface ScriptureAudioPackageRepository {
  readInstalled(translationId: string, segmentId: string): Promise<InstalledScriptureAudioPackage | null>;
  listInstalled(): Promise<readonly InstalledScriptureAudioPackage[]>;
  readPayload(translationId: string, segmentId: string): Promise<ArrayBuffer | null>;
  replaceInstalled(record: InstalledScriptureAudioPackage, payload: ArrayBuffer): Promise<void>;
  removeInstalled(translationId: string, segmentId: string): Promise<void>;
  usage(): Promise<Readonly<{ bytes: number; packages: number }>>;
}

export interface ScriptureAudioPackageTransport {
  download(url: string, options: Readonly<{
    signal: AbortSignal;
    onProgress?: (receivedBytes: number, totalBytes?: number) => void;
  }>): Promise<ArrayBuffer>;
}

export interface ScriptureAudioPackageProgress {
  readonly phase: 'downloading' | 'verifying' | 'storing' | 'complete';
  readonly translationId: string;
  readonly segmentId: string;
  readonly receivedBytes: number;
  readonly totalBytes: number;
  readonly ratio: number;
}

export type ScriptureAudioPackageResult = Readonly<{
  status: 'current' | 'installed';
  package: InstalledScriptureAudioPackage;
}>;

const SHA256_HEX = /^[a-f0-9]{64}$/i;
export const V6_AUDIO_SEGMENT_MAX_BYTES = 1_000_000_000;

function abortError(): Error {
  const error = new Error('Scripture audio download cancelled.');
  error.name = 'AbortError';
  return error;
}

function operationKey(translationId: string, segmentId: string): string {
  return `${translationId}:${segmentId}`;
}

function isSegmentInManifest(manifest: ScriptureAudioManifest, segment: ScriptureAudioSegment): boolean {
  return manifest.segments.some(candidate => candidate.id === segment.id
    && candidate.book === segment.book
    && candidate.chapter === segment.chapter
    && candidate.byteLength === segment.byteLength
    && candidate.url === segment.url
    && Boolean(candidate.sha256 && segment.sha256)
    && candidate.sha256!.toLowerCase() === segment.sha256!.toLowerCase());
}

/** Selective, integrity-checked audio downloads. No payload is written before rights, text revision, size and hash gates pass. */
export class ScriptureAudioPackageManager {
  readonly #repository: ScriptureAudioPackageRepository;
  readonly #transport: ScriptureAudioPackageTransport;
  readonly #ceilingBytes: number;
  readonly #now: () => string;
  readonly #active = new Map<string, AbortController>();

  constructor(input: {
    repository: ScriptureAudioPackageRepository;
    transport: ScriptureAudioPackageTransport;
    ceilingBytes?: number;
    now?: () => string;
  }) {
    if (!input?.repository || !input?.transport || typeof input.transport.download !== 'function') {
      throw new Error('Scripture audio package manager requires storage and download boundaries.');
    }
    const ceilingBytes = input.ceilingBytes ?? V6_READER_AUDIO_STORAGE_CEILING_BYTES;
    if (!Number.isSafeInteger(ceilingBytes) || ceilingBytes < 1) throw new Error('Audio storage ceiling must be a positive safe integer.');
    this.#repository = input.repository;
    this.#transport = input.transport;
    this.#ceilingBytes = ceilingBytes;
    this.#now = input.now ?? (() => new Date().toISOString());
  }

  listInstalled() { return this.#repository.listInstalled(); }
  readInstalled(translationId: string, segmentId: string) { return this.#repository.readInstalled(translationId, segmentId); }
  usage() { return this.#repository.usage(); }
  readPayload(translationId: string, segmentId: string) { return this.#repository.readPayload(translationId, segmentId); }

  cancel(translationId: string, segmentId: string): boolean {
    const controller = this.#active.get(operationKey(translationId, segmentId));
    if (!controller) return false;
    controller.abort();
    return true;
  }

  async remove(translationId: string, segmentId: string): Promise<void> {
    const key = operationKey(translationId, segmentId);
    if (this.#active.has(key)) throw new Error('Cancel the active audio download before removing this chapter.');
    await this.#repository.removeInstalled(translationId, segmentId);
  }

  async install(
    manifest: ScriptureAudioManifest,
    segment: ScriptureAudioSegment,
    options: Readonly<{
      signal?: AbortSignal;
      onProgress?: (progress: ScriptureAudioPackageProgress) => void;
    }> = {},
  ): Promise<ScriptureAudioPackageResult> {
    const eligibility = audioOfflineEligibility(manifest, this.#ceilingBytes);
    if (!eligibility.eligible) throw new Error(`Scripture audio cannot be downloaded: ${eligibility.reason}.`);
    if (typeof manifest.contentVersion !== 'string' || !manifest.contentVersion.trim()
      || !manifest.source.scriptureContentVersion || !isSegmentInManifest(manifest, segment)) {
      throw new Error('Audio package identity or immutable content revision is missing.');
    }
    if (!Number.isSafeInteger(segment.byteLength) || !SHA256_HEX.test(String(segment.sha256 ?? ''))
      || segment.byteLength! > V6_AUDIO_SEGMENT_MAX_BYTES) {
      throw new Error('Audio chapter package size or checksum metadata is invalid.');
    }

    const key = operationKey(manifest.translationId, segment.id);
    if (this.#active.has(key)) throw new Error('This audio chapter already has an active download.');
    const current = await this.#repository.readInstalled(manifest.translationId, segment.id);
    if (current?.audioContentVersion === manifest.contentVersion
      && current.scriptureContentVersion === manifest.source.scriptureContentVersion
      && current.sha256.toLowerCase() === segment.sha256!.toLowerCase()
      && current.bytes === segment.byteLength) {
      const payload = await this.#repository.readPayload(manifest.translationId, segment.id);
      if (payload && payload.byteLength === current.bytes && await verifyPackageChecksum(payload, current.sha256)) {
        return Object.freeze({ status: 'current', package: current });
      }
    }

    const controller = new AbortController();
    const externalSignal = options.signal;
    const abort = () => controller.abort();
    if (externalSignal?.aborted) controller.abort();
    else externalSignal?.addEventListener('abort', abort, { once: true });
    this.#active.set(key, controller);

    const emit = (phase: ScriptureAudioPackageProgress['phase'], receivedBytes: number) => {
      const received = Math.min(segment.byteLength!, Math.max(0, Math.floor(Number(receivedBytes) || 0)));
      options.onProgress?.(Object.freeze({
        phase,
        translationId: manifest.translationId,
        segmentId: segment.id,
        receivedBytes: received,
        totalBytes: segment.byteLength!,
        ratio: segment.byteLength ? received / segment.byteLength : 0,
      }));
    };

    try {
      if (controller.signal.aborted) throw abortError();
      emit('downloading', 0);
      const payload = await this.#transport.download(segment.url, {
        signal: controller.signal,
        onProgress: received => emit('downloading', received),
      });
      if (controller.signal.aborted) throw abortError();
      if (payload.byteLength !== segment.byteLength) throw new Error('Audio chapter size does not match its manifest.');
      emit('verifying', payload.byteLength);
      if (!await verifyPackageChecksum(payload, segment.sha256!)) throw new Error('Audio chapter checksum does not match its manifest.');
      if (controller.signal.aborted) throw abortError();

      const usage = await this.#repository.usage();
      const oldBytes = current?.bytes ?? 0;
      if (!Number.isSafeInteger(usage.bytes) || usage.bytes < 0 || !Number.isSafeInteger(oldBytes) || oldBytes < 0) {
        throw new Error('Installed audio storage inventory is invalid.');
      }
      const projected = Math.max(0, usage.bytes - oldBytes) + payload.byteLength;
      if (!Number.isSafeInteger(projected) || projected >= this.#ceilingBytes) {
        throw new Error(`Scripture audio storage would reach ${projected} bytes; downloads must remain below ${this.#ceilingBytes} bytes.`);
      }

      const record: InstalledScriptureAudioPackage = Object.freeze({
        translationId: manifest.translationId,
        audioContentVersion: manifest.contentVersion,
        scriptureContentVersion: manifest.source.scriptureContentVersion,
        segmentId: segment.id,
        book: segment.book.toUpperCase(),
        chapter: segment.chapter,
        sha256: segment.sha256!.toLowerCase(),
        bytes: payload.byteLength,
        installedAt: this.#now(),
      });
      if (controller.signal.aborted) throw abortError();
      emit('storing', payload.byteLength);
      await this.#repository.replaceInstalled(record, payload.slice(0));
      emit('complete', payload.byteLength);
      return Object.freeze({ status: 'installed', package: record });
    } finally {
      externalSignal?.removeEventListener('abort', abort);
      if (this.#active.get(key) === controller) this.#active.delete(key);
    }
  }
}

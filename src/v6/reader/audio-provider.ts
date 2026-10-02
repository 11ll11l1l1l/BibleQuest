import { audioOfflineEligibility, audioStreamingEligibility, type ScriptureAudioManifest } from './audio-policy.ts';
import { validateChapterAlignment, type ScriptureChapterAlignment } from './audio-alignment.ts';
import { createChapterAudioPlayer, type ChapterAudioPlaybackState } from './audio-player.ts';
import type { ScriptureAudioPackageManager, ScriptureAudioPackageProgress, ScriptureAudioPackageRepository } from './audio-packages.ts';

export interface ReaderAudioSnapshot {
  readonly available: boolean;
  readonly reason: string;
  readonly playback: ChapterAudioPlaybackState | null;
}

export interface ReaderAudioStore {
  read<T>(key: string, fallback: T): T;
  write<T>(key: string, value: T): unknown;
}

const RESUME_KEY = 'v6-reader-audio-resume';

/** Reader-owned audio provider. Direct streaming and offline package eligibility
 * are evaluated separately; verse timing is optional for chapter playback. */
export function createReaderAudioProvider(input: {
  readonly manifest?: ScriptureAudioManifest | null;
  readonly alignments?: readonly ScriptureChapterAlignment[];
  /** Version from the active Bible data provider, required to match reviewed audio metadata. */
  readonly scriptureContentVersion?: string | null;
  readonly store: ReaderAudioStore;
  readonly createAudio: () => HTMLAudioElement;
  readonly mediaSession?: MediaSession | null;
  readonly offlinePackages?: ScriptureAudioPackageRepository;
  readonly packageManager?: ScriptureAudioPackageManager;
  readonly createObjectURL?: (blob: Blob) => string;
  readonly revokeObjectURL?: (url: string) => void;
  readonly isOffline?: () => boolean;
}) {
  if (!input?.store || typeof input.store.read !== 'function' || typeof input.store.write !== 'function') {
    throw new Error('Reader audio provider requires a persistent store boundary.');
  }
  const manifest = input.manifest ?? null;
  const alignments = input.alignments ?? [];
  const streamDecision = audioStreamingEligibility(manifest);
  const packageDecision = audioOfflineEligibility(manifest);
  const alignmentByChapter = new Map<string, ScriptureChapterAlignment>();
  let reason = !manifest
    ? 'BSB Audio Bible is unavailable because no approved manifest is configured.'
    : streamDecision.eligible ? '' : `BSB Audio Bible is unavailable: ${streamDecision.reason}.`;
  if (manifest && manifest.translationId !== 'bsb') reason = 'BSB Audio Bible is unavailable: only the BSB translation is supported.';
  if (manifest && (!input.scriptureContentVersion
    || input.scriptureContentVersion !== manifest.source.scriptureContentVersion)) {
    reason = 'BSB Audio Bible is unavailable: audio was aligned to a different Scripture content revision.';
  }
  if (manifest && streamDecision.eligible && manifest.source.rights === 'verified') {
    const sourceEvidence = manifest.source as typeof manifest.source & { rightsEvidence?: string; reviewedBy?: string; reviewedAt?: string };
    if (!sourceEvidence.rightsEvidence?.trim() || !sourceEvidence.reviewedBy?.trim()
      || typeof sourceEvidence.reviewedAt !== 'string' || !Number.isFinite(Date.parse(sourceEvidence.reviewedAt))) {
      reason = 'BSB Audio Bible is unavailable: rights review evidence is incomplete.';
    }
  }
  if (streamDecision.eligible && manifest) {
    for (const alignment of alignments) {
      const book = String(alignment?.book ?? '').toUpperCase();
      const chapter = Number(alignment?.chapter);
      const key = `${book}:${chapter}`;
      if (alignmentByChapter.has(key)) {
        reason = `BSB Audio Bible is unavailable: duplicate verse timing for ${key}.`;
        break;
      }
      if (alignment.alignmentSource !== manifest.alignmentSource || alignment.contentVersion !== manifest.contentVersion
        || alignment.scriptureContentVersion !== manifest.source.scriptureContentVersion
        || alignment.source !== manifest.source.source || alignment.license !== manifest.source.license) {
        reason = `BSB Audio Bible is unavailable: audio/alignment revision mismatch for ${key}.`;
        break;
      }
      const validation = validateChapterAlignment(alignment, { translationId: manifest.translationId });
      if (!validation.valid) {
        reason = `BSB Audio Bible is unavailable: invalid verse timing for ${key}.`;
        break;
      }
      alignmentByChapter.set(key, alignment);
    }
  }
  const available = streamDecision.eligible && reason === '' && Boolean(manifest);
  const offlineAvailable = packageDecision.eligible && Boolean(manifest)
    && reason === '' && Boolean(input.packageManager);
  const listeners = new Set<(snapshot: ReaderAudioSnapshot) => void>();
  const readResume = () => input.store.read<Record<string, number>>(RESUME_KEY, {});
  const writeResume = (key: string, seconds: number) => {
    const saved = readResume();
    input.store.write(RESUME_KEY, { ...saved, [key]: seconds });
  };
  const createObjectURL = input.createObjectURL ?? globalThis.URL?.createObjectURL?.bind(globalThis.URL);
  const revokeObjectURL = input.revokeObjectURL ?? globalThis.URL?.revokeObjectURL?.bind(globalThis.URL);
  let activeObjectUrl: string | null = null;
  const resolveAudioUrl = input.offlinePackages ? async (segment: ScriptureAudioManifest['segments'][number]) => {
    const record = await input.offlinePackages!.readInstalled(manifest!.translationId, segment.id);
    const payload = record ? await input.offlinePackages!.readPayload(manifest!.translationId, segment.id) : null;
    const current = Boolean(record && payload
      && record.audioContentVersion === manifest!.contentVersion
      && record.scriptureContentVersion === manifest!.source.scriptureContentVersion
      && record.book === segment.book.toUpperCase() && record.chapter === segment.chapter
      && Boolean(segment.sha256 && segment.byteLength)
      && record.sha256.toLowerCase() === segment.sha256!.toLowerCase()
      && record.bytes === segment.byteLength && payload.byteLength === segment.byteLength);
    if (input.isOffline?.() && !current) throw new Error('This BSB audio chapter is not installed for offline playback.');
    if (!current) {
      if (activeObjectUrl && revokeObjectURL) revokeObjectURL(activeObjectUrl);
      activeObjectUrl = null;
      return segment.url;
    }
    if (!createObjectURL || !revokeObjectURL) throw new Error('Offline audio playback is unavailable in this browser.');
    if (activeObjectUrl) revokeObjectURL(activeObjectUrl);
    activeObjectUrl = createObjectURL(new Blob([payload!], { type: 'audio/mpeg' }));
    return activeObjectUrl;
  } : undefined;
  const player = available && manifest
    ? createChapterAudioPlayer({
      translationId: manifest.translationId,
      manifest,
      alignments,
      createAudio: input.createAudio,
      mediaSession: input.mediaSession,
      resolveAudioUrl,
      resolveNextChapter: (bookCode, chapter) => {
        const index = manifest.segments.findIndex(segment => segment.book.toUpperCase() === bookCode.toUpperCase() && segment.chapter === chapter);
        const next = index >= 0 ? manifest.segments[index + 1] : null;
        return next ? { bookCode: next.book, chapter: next.chapter } : null;
      },
      resolvePreviousChapter: (bookCode, chapter) => {
        const index = manifest.segments.findIndex(segment => segment.book.toUpperCase() === bookCode.toUpperCase() && segment.chapter === chapter);
        const previous = index > 0 ? manifest.segments[index - 1] : null;
        return previous ? { bookCode: previous.book, chapter: previous.chapter } : null;
      },
      getResume: key => readResume()[key],
      saveResume: writeResume,
      onState: () => publish(),
      onVerse: () => publish(),
    })
    : null;
  const snapshot = (): ReaderAudioSnapshot => Object.freeze({
    available,
    reason,
    playback: player?.getState() ?? null,
  });
  function publish() {
    const current = snapshot();
    for (const listener of listeners) listener(current);
  }
  return Object.freeze({
    isAvailable: () => available,
    canDownloadOffline: () => offlineAvailable,
    hasVerseAlignment: (bookCode: string, chapter: number) => alignmentByChapter.has(`${String(bookCode).toUpperCase()}:${chapter}`),
    getState: snapshot,
    subscribe(listener: (state: ReaderAudioSnapshot) => void) {
      if (typeof listener !== 'function') throw new Error('Reader audio subscription requires a callback.');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    load(translationId: string, bookCode: string, chapter: number) {
      if (!available || !player) throw new Error(reason || 'BSB Audio Bible is unavailable.');
      if (translationId !== manifest?.translationId) throw new Error('Audio is available only for its exact Scripture translation.');
      return player.load(bookCode, chapter);
    },
    play() {
      if (!player) throw new Error(reason || 'BSB Audio Bible is unavailable.');
      return player.play();
    },
    pause() {
      return player?.pause() ?? null;
    },
    seek(seconds: number) {
      if (!player) throw new Error(reason || 'BSB Audio Bible is unavailable.');
      return player.seek(seconds);
    },
    seekVerse(verse: number) {
      if (!player) throw new Error(reason || 'BSB Audio Bible is unavailable.');
      return player.seekVerse(verse);
    },
    setPlaybackRate(rate: number) {
      if (!player) throw new Error(reason || 'BSB Audio Bible is unavailable.');
      return player.setPlaybackRate(rate);
    },
    setAutoNext(enabled: boolean) {
      if (!player) throw new Error(reason || 'BSB Audio Bible is unavailable.');
      return player.setAutoNext(enabled);
    },
    setSleepTimer(minutes: number | null) {
      if (!player) throw new Error(reason || 'BSB Audio Bible is unavailable.');
      return player.setSleepTimer(minutes);
    },
    async getInstalledPackage(bookCode: string, chapter: number) {
      if (!offlineAvailable || !manifest || !input.packageManager) return null;
      const segment = manifest.segments.find(row => row.book.toUpperCase() === String(bookCode).toUpperCase() && row.chapter === chapter);
      if (!segment) return null;
      const record = await input.packageManager.readInstalled(manifest.translationId, segment.id);
      if (!segment.sha256 || !segment.byteLength || !record || record.audioContentVersion !== manifest.contentVersion || record.scriptureContentVersion !== manifest.source.scriptureContentVersion
        || record.sha256.toLowerCase() !== segment.sha256.toLowerCase() || record.bytes !== segment.byteLength) return null;
      return record;
    },
    installChapter(bookCode: string, chapter: number, onProgress?: (progress: ScriptureAudioPackageProgress) => void) {
      if (!offlineAvailable || !manifest || !input.packageManager) throw new Error(reason || `Offline audio downloads are unavailable: ${packageDecision.reason}.`);
      const segment = manifest.segments.find(row => row.book.toUpperCase() === String(bookCode).toUpperCase() && row.chapter === chapter);
      if (!segment) throw new Error('This chapter does not have an approved exact-source audio package.');
      return input.packageManager.install(manifest, segment, { onProgress });
    },
    cancelChapter(bookCode: string, chapter: number) {
      if (!manifest || !input.packageManager) return false;
      const segment = manifest.segments.find(row => row.book.toUpperCase() === String(bookCode).toUpperCase() && row.chapter === chapter);
      return segment ? input.packageManager.cancel(manifest.translationId, segment.id) : false;
    },
    async removeChapter(bookCode: string, chapter: number) {
      if (!offlineAvailable || !manifest || !input.packageManager) throw new Error(reason || `Offline audio packages are unavailable: ${packageDecision.reason}.`);
      const segment = manifest.segments.find(row => row.book.toUpperCase() === String(bookCode).toUpperCase() && row.chapter === chapter);
      if (!segment) throw new Error('This chapter has no approved audio package.');
      await input.packageManager.remove(manifest.translationId, segment.id);
    },
    dispose() {
      player?.dispose();
      if (activeObjectUrl && revokeObjectURL) revokeObjectURL(activeObjectUrl);
      activeObjectUrl = null;
      listeners.clear();
    },
  });
}

export type ReaderAudioProvider = ReturnType<typeof createReaderAudioProvider>;

/** Switches between independently validated narration manifests behind one Reader audio seam. */
export function createReaderAudioSourceRouter(input: {
  readonly sources: readonly Readonly<{ id: string; label: string; provider: ReaderAudioProvider }>[];
  readonly store: ReaderAudioStore;
  readonly defaultSourceId: string;
}): ReaderAudioProvider & {
  getNarrator(): string;
  getNarrators(): readonly Readonly<{ id: string; label: string }>[];
  selectNarrator(id: string): Promise<boolean>;
} {
  if (!Array.isArray(input?.sources) || input.sources.length === 0) throw new Error('Reader audio source router requires at least one source.');
  const ids = new Set<string>();
  for (const source of input.sources) {
    if (!/^[a-z0-9_-]{1,32}$/i.test(source.id) || !source.label.trim() || ids.has(source.id)
      || typeof source.provider?.getState !== 'function') throw new Error('Reader audio source router has an invalid or duplicate source.');
    ids.add(source.id);
  }
  const sourceById = new Map(input.sources.map(source => [source.id, source]));
  const availableSources = input.sources.filter(source => source.provider.isAvailable());
  const initial = input.store.read<string>('v6-reader-audio-narrator', input.defaultSourceId);
  let selectedId = availableSources.some(source => source.id === initial)
    ? initial
    : availableSources.find(source => source.id === input.defaultSourceId)?.id || availableSources[0]?.id || input.sources[0].id;
  const listeners = new Set<(snapshot: ReaderAudioSnapshot) => void>();
  const unsubscribers = input.sources.map(source => source.provider.subscribe(() => {
    const current = sourceById.get(selectedId)?.provider;
    if (current === source.provider) for (const listener of listeners) listener(current.getState());
  }));
  const current = () => sourceById.get(selectedId)!.provider;
  const router = {
    isAvailable: () => current().isAvailable(),
    canDownloadOffline: () => current().canDownloadOffline(),
    hasVerseAlignment: (bookCode: string, chapter: number) => current().hasVerseAlignment(bookCode, chapter),
    getState: () => current().getState(),
    subscribe(listener: (snapshot: ReaderAudioSnapshot) => void) {
      if (typeof listener !== 'function') throw new Error('Reader audio subscription requires a callback.');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getNarrator: () => selectedId,
    getNarrators: () => Object.freeze(availableSources.map(({ id, label }) => Object.freeze({ id, label }))),
    async selectNarrator(id: string) {
      const target = sourceById.get(id);
      if (!target?.provider.isAvailable()) return false;
      if (id === selectedId) return true;
      const previous = current();
      const playback = previous.getState().playback;
      previous.pause();
      if (playback?.bookCode && playback.chapter > 0) {
        try { await target.provider.load(playback.translationId, playback.bookCode, playback.chapter); }
        catch { return false; }
      }
      selectedId = id;
      try { input.store.write('v6-reader-audio-narrator', id); } catch { /* Storage failure does not block streaming. */ }
      for (const listener of listeners) listener(current().getState());
      return true;
    },
    load: (translationId: string, bookCode: string, chapter: number) => current().load(translationId, bookCode, chapter),
    play: () => current().play(),
    pause: () => current().pause(),
    seek: (seconds: number) => current().seek(seconds),
    seekVerse: (verse: number) => current().seekVerse(verse),
    setPlaybackRate: (rate: number) => current().setPlaybackRate(rate),
    setAutoNext: (enabled: boolean) => current().setAutoNext(enabled),
    setSleepTimer: (minutes: number | null) => current().setSleepTimer(minutes),
    getInstalledPackage: (bookCode: string, chapter: number) => current().getInstalledPackage(bookCode, chapter),
    installChapter: (bookCode: string, chapter: number, onProgress?: (progress: ScriptureAudioPackageProgress) => void) => current().installChapter(bookCode, chapter, onProgress),
    cancelChapter: (bookCode: string, chapter: number) => current().cancelChapter(bookCode, chapter),
    removeChapter: (bookCode: string, chapter: number) => current().removeChapter(bookCode, chapter),
    dispose() {
      for (const unsubscribe of unsubscribers) unsubscribe();
      for (const source of input.sources) source.provider.dispose();
      listeners.clear();
    },
  };
  return Object.freeze(router);
}

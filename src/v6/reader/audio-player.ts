import type { ScriptureAudioManifest, ScriptureAudioSegment } from './audio-policy.ts';
import {
  audioTimeForVerse,
  validateChapterAlignment,
  verseAtAudioTime,
  type ScriptureChapterAlignment,
} from './audio-alignment.ts';

export interface ChapterAudioElement {
  src: string;
  currentTime: number;
  playbackRate: number;
  paused: boolean;
  play(): Promise<void>;
  pause(): void;
  load(): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export interface ChapterAudioPlaybackState {
  readonly status: 'idle' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';
  readonly translationId: string;
  readonly bookCode: string;
  readonly chapter: number;
  readonly currentVerse: number | null;
  readonly currentTime: number;
  readonly duration: number | null;
  readonly playbackRate: number;
  readonly autoNext: boolean;
  readonly sleepTimerMinutes: number | null;
  readonly error: string;
}

export interface ChapterAudioIdentity {
  readonly bookCode: string;
  readonly chapter: number;
}

const ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,31}$/;
const BOOK_PATTERN = /^(?:[1-3])?[A-Z]{2,3}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const RATES = Object.freeze([0.75, 1, 1.25, 1.5, 1.75, 2]);

function chapterSegment(manifest: ScriptureAudioManifest, bookCode: string, chapter: number): ScriptureAudioSegment {
  const code = String(bookCode ?? '').trim().toUpperCase();
  if (!ID_PATTERN.test(manifest.translationId) || manifest.source.translationId !== manifest.translationId) {
    throw new Error('Audio manifest translation identity is invalid.');
  }
  if (!BOOK_PATTERN.test(code) || !Number.isSafeInteger(chapter) || chapter < 1) {
    throw new Error('Audio chapter identity is invalid.');
  }
  const matches = manifest.segments.filter((segment) => segment.book.toUpperCase() === code && segment.chapter === chapter);
  if (matches.length !== 1) throw new Error(`No unique audio segment exists for ${code} ${chapter}.`);
  const segment = matches[0];
  if ((segment.sha256 !== undefined && !SHA256_PATTERN.test(segment.sha256))
    || (segment.byteLength !== undefined && (!Number.isSafeInteger(segment.byteLength) || segment.byteLength <= 0))) {
    throw new Error('Audio segment integrity metadata is invalid.');
  }
  const url = new URL(segment.url);
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) {
    throw new Error('Audio segment URL must use a safe HTTPS source.');
  }
  return segment;
}

/** One-owner chapter playback seam. It never enables package downloads; callers must first
 * establish rights and exact BSB alignment through audioOfflineEligibility. */
export function createChapterAudioPlayer(input: {
  readonly translationId: string;
  readonly manifest: ScriptureAudioManifest;
  readonly alignments?: readonly ScriptureChapterAlignment[];
  readonly createAudio: () => ChapterAudioElement;
  readonly onState?: (state: ChapterAudioPlaybackState) => void;
  readonly onVerse?: (verse: number | null) => void;
  readonly getResume?: (key: string) => number | null | undefined;
  readonly saveResume?: (key: string, seconds: number) => void;
  readonly mediaSession?: MediaSession | null;
  /** Resolves an integrity-verified installed chapter to a temporary playable URL. */
  readonly resolveAudioUrl?: (segment: ScriptureAudioSegment) => string | Promise<string>;
  readonly resolveNextChapter?: (bookCode: string, chapter: number) => ChapterAudioIdentity | null;
  readonly setTimeout?: (callback: () => void, milliseconds: number) => unknown;
  readonly clearTimeout?: (handle: unknown) => void;
}) {
  const translationId = String(input?.translationId ?? '').trim();
  if (!ID_PATTERN.test(translationId) || input?.manifest?.translationId !== translationId) {
    throw new Error('Audio player translation does not match its manifest.');
  }
  if (typeof input.createAudio !== 'function') throw new Error('Audio player requires an audio element factory.');
  const audio = input.createAudio();
  if (!audio || typeof audio.play !== 'function' || typeof audio.pause !== 'function') {
    throw new Error('Audio player factory returned an invalid element.');
  }
  const publish = input.onState ?? (() => {});
  const publishVerse = input.onVerse ?? (() => {});
  const getResume = input.getResume ?? (() => null);
  const saveResume = input.saveResume ?? (() => {});
  const mediaSession = input.mediaSession ?? null;
  const resolveNextChapter = input.resolveNextChapter ?? (() => null);
  const schedule = input.setTimeout ?? ((callback, milliseconds) => globalThis.setTimeout(callback, milliseconds));
  const cancel = input.clearTimeout ?? (handle => globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>));
  let state: ChapterAudioPlaybackState = Object.freeze({
    status: 'idle', translationId, bookCode: '', chapter: 0, currentVerse: null, currentTime: 0, duration: null,
    playbackRate: 1, autoNext: false, sleepTimerMinutes: null, error: '',
  });
  let segment: ScriptureAudioSegment | null = null;
  let alignment: ScriptureChapterAlignment | null = null;
  let disposed = false;
  let sleepTimer: unknown = null;
  let loadGeneration = 0;

  const commit = (patch: Partial<ChapterAudioPlaybackState>) => {
    state = Object.freeze({ ...state, ...patch });
    publish(state);
    return state;
  };
  const resumeKey = () => `${state.translationId}:${state.bookCode}:${state.chapter}`;
  const updatePosition = () => {
    if (disposed || state.status === 'idle') return;
    const currentTime = Number.isFinite(audio.currentTime) && audio.currentTime >= 0 ? audio.currentTime : 0;
    saveResume(resumeKey(), currentTime);
    const currentVerse = alignment ? verseAtAudioTime(alignment, currentTime) : null;
    if (currentVerse !== state.currentVerse) publishVerse(currentVerse);
    commit({ currentTime, duration: Number.isFinite((audio as HTMLAudioElement).duration)
      ? (audio as HTMLAudioElement).duration : state.duration, currentVerse });
    setPositionState();
  };
  const onTime = () => updatePosition();
  const onPlay = () => commit({ status: 'playing', error: '' });
  const onPause = () => { updatePosition(); if (!disposed && state.status === 'playing') commit({ status: 'paused' }); };
  const onEnded = () => {
    updatePosition();
    commit({ status: 'ended' });
    if (state.autoNext) void advanceToNext(true);
  };
  const onError = () => commit({ status: 'error', error: 'Audio could not be loaded. Check the connection and retry.' });
  audio.addEventListener('timeupdate', onTime);
  audio.addEventListener('play', onPlay);
  audio.addEventListener('pause', onPause);
  audio.addEventListener('ended', onEnded);
  audio.addEventListener('error', onError);

  const setPositionState = () => {
    if (!mediaSession || typeof mediaSession.setPositionState !== 'function') return;
    try {
      mediaSession.setPositionState({
        duration: state.duration && state.duration > 0 ? state.duration : 0,
        playbackRate: state.playbackRate,
        position: state.duration ? Math.min(state.currentTime, state.duration) : 0,
      });
    } catch { /* Browser support and duration metadata vary. */ }
  };

  const setMediaAction = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
    if (!mediaSession || typeof mediaSession.setActionHandler !== 'function') return;
    try { mediaSession.setActionHandler(action, handler); }
    catch { /* Unsupported lock-screen actions degrade without blocking playback. */ }
  };

  const clearSleepTimer = () => {
    if (sleepTimer !== null) cancel(sleepTimer);
    sleepTimer = null;
  };

  const advanceToNext = async (autoplay: boolean) => {
    if (!segment || disposed) return state;
    const next = resolveNextChapter(state.bookCode, state.chapter);
    if (!next) return state;
    const pending = player.load(next.bookCode, next.chapter);
    const generation = loadGeneration;
    try {
      await pending;
      if (disposed || generation !== loadGeneration) return state;
      if (autoplay) await player.play();
      return state;
    } catch (error) {
      if (disposed || generation !== loadGeneration) return state;
      return commit({ status: 'error', error: error instanceof Error ? error.message : 'Next chapter could not be loaded.' });
    }
  };

  const player = Object.freeze({
    getState: () => state,
    async load(bookCode: string, chapter: number) {
      if (disposed) throw new Error('Audio player has been disposed.');
      const generation = ++loadGeneration;
      const next = chapterSegment(input.manifest, bookCode, chapter);
      const code = next.book.toUpperCase();
      const nextAlignment = (input.alignments ?? []).find(row => row.book.toUpperCase() === code && row.chapter === next.chapter) ?? null;
      if (nextAlignment) {
        const validation = validateChapterAlignment(nextAlignment, { translationId, book: code, chapter: next.chapter });
        if (!validation.valid) throw new Error(`Audio verse alignment is invalid: ${validation.issues.join('; ')}`);
      }
      const sourceUrl = input.resolveAudioUrl ? await input.resolveAudioUrl(next) : next.url;
      if (disposed || generation !== loadGeneration) throw new Error('Audio chapter selection was superseded.');
      let parsedSource: URL;
      try { parsedSource = new URL(sourceUrl); }
      catch { throw new Error('Resolved audio source URL is invalid.'); }
      if (!['https:', 'blob:'].includes(parsedSource.protocol) || parsedSource.username || parsedSource.password) {
        throw new Error('Resolved audio source must use a safe HTTPS or temporary blob URL.');
      }
      segment = next;
      alignment = nextAlignment;
      audio.pause();
      audio.src = sourceUrl;
      audio.load();
      const resume = Number(getResume(`${translationId}:${code}:${next.chapter}`));
      audio.currentTime = Number.isFinite(resume) && resume >= 0 ? resume : 0;
      const currentVerse = alignment ? verseAtAudioTime(alignment, audio.currentTime) : null;
      publishVerse(currentVerse);
      commit({ status: 'ready', bookCode: next.book.toUpperCase(), chapter: next.chapter, currentVerse,
        currentTime: audio.currentTime, duration: null, error: '' });
      if (mediaSession) {
        setMediaAction('play', () => { void player.play(); });
        setMediaAction('pause', () => { player.pause(); });
        setMediaAction('seekto', details => { if (details.seekTime !== undefined) player.seek(details.seekTime); });
        setMediaAction('seekbackward', details => player.seek(Math.max(0, state.currentTime - (details.seekOffset || 10))));
        setMediaAction('seekforward', details => player.seek(state.currentTime + (details.seekOffset || 10)));
        setMediaAction('nexttrack', () => { void advanceToNext(true); });
        if (typeof MediaMetadata === 'function') {
          mediaSession.metadata = new MediaMetadata({ title: `${code} ${next.chapter}`, album: 'BibleQuest Audio Bible' });
        }
      }
      setPositionState();
      return state;
    },
    async play() {
      if (disposed || !segment) throw new Error('Load a Bible chapter before playing audio.');
      try { await audio.play(); return state; }
      catch (error) {
        commit({ status: 'error', error: error instanceof Error ? error.message : 'Audio playback failed.' });
        throw error;
      }
    },
    pause() {
      if (disposed) return state;
      loadGeneration += 1;
      audio.pause();
      updatePosition();
      return state;
    },
    seek(seconds: number) {
      if (disposed || !segment) throw new Error('Load a Bible chapter before seeking.');
      const value = Number(seconds);
      if (!Number.isFinite(value) || value < 0 || (state.duration !== null && value > state.duration)) {
        throw new Error('Audio seek position is invalid.');
      }
      audio.currentTime = value;
      updatePosition();
      setPositionState();
      return state;
    },
    seekVerse(verse: number) {
      if (!alignment) throw new Error('Verse seeking requires verified chapter timing data.');
      const seconds = audioTimeForVerse(alignment, verse);
      if (seconds === null) throw new Error('Verse is not present in the chapter timing data.');
      return player.seek(seconds);
    },
    setPlaybackRate(rate: number) {
      if (!RATES.includes(rate)) throw new Error('Playback speed must be between 0.75× and 2×.');
      audio.playbackRate = rate;
      commit({ playbackRate: rate });
      setPositionState();
      return state;
    },
    setAutoNext(enabled: boolean) {
      if (typeof enabled !== 'boolean') throw new Error('Auto-next setting must be true or false.');
      return commit({ autoNext: enabled });
    },
    setSleepTimer(minutes: number | null) {
      if (minutes !== null && (!Number.isInteger(minutes) || minutes < 1 || minutes > 240)) {
        throw new Error('Sleep timer must be cleared or set from 1 to 240 minutes.');
      }
      clearSleepTimer();
      if (minutes === null) return commit({ sleepTimerMinutes: null });
      sleepTimer = schedule(() => {
        sleepTimer = null;
        if (disposed) return;
        commit({ sleepTimerMinutes: null });
        player.pause();
      }, minutes * 60_000);
      return commit({ sleepTimerMinutes: minutes });
    },
    dispose() {
      if (disposed) return;
      loadGeneration += 1;
      updatePosition();
      disposed = true;
      clearSleepTimer();
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.src = '';
      audio.load();
      segment = null;
      alignment = null;
      publishVerse(null);
      if (mediaSession) {
        setMediaAction('play', null);
        setMediaAction('pause', null);
        setMediaAction('seekto', null);
        setMediaAction('seekbackward', null);
        setMediaAction('seekforward', null);
        setMediaAction('nexttrack', null);
        mediaSession.metadata = null;
      }
    },
  });
  return player;
}

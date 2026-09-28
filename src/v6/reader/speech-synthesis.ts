import type { ReaderChapter, ReaderTranslationId } from './contracts.ts';

export type ReaderSpeechStatus = 'unavailable' | 'idle' | 'ready' | 'speaking' | 'paused' | 'ended' | 'error';

export type ReaderSpeechSnapshot = Readonly<{
  status: ReaderSpeechStatus;
  translationId: ReaderTranslationId | null;
  bookCode: string | null;
  chapter: number | null;
  currentVerse: number | null;
  playbackRate: number;
  error: string;
}>;

type SpeechUtteranceLike = {
  lang: string;
  rate: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
};

type SpeechSynthesisLike = {
  speak(utterance: SpeechUtteranceLike): void;
  pause(): void;
  resume(): void;
  cancel(): void;
};

const LANGUAGE_BY_TRANSLATION: Readonly<Partial<Record<ReaderTranslationId, string>>> = Object.freeze({
  tl: 'fil-PH',
  cebocb: 'ceb-PH',
  jko: 'ja-JP',
});
const MIN_RATE = 0.75;
const MAX_RATE = 2;

function freezeSnapshot(snapshot: ReaderSpeechSnapshot): ReaderSpeechSnapshot {
  return Object.freeze({ ...snapshot });
}

/** Browser speech synthesis fallback for text translations without a human narration track. */
export function createReaderSpeechSynthesis(input: {
  readonly synthesis?: SpeechSynthesisLike | null;
  readonly createUtterance?: (text: string) => SpeechUtteranceLike;
} = {}) {
  const synthesis = input.synthesis ?? null;
  const createUtterance = input.createUtterance;
  const available = Boolean(synthesis && typeof synthesis.speak === 'function'
    && typeof synthesis.pause === 'function' && typeof synthesis.resume === 'function'
    && typeof synthesis.cancel === 'function' && typeof createUtterance === 'function');
  const listeners = new Set<(snapshot: ReaderSpeechSnapshot) => void>();
  let state = freezeSnapshot({
    status: available ? 'idle' : 'unavailable',
    translationId: null, bookCode: null, chapter: null, currentVerse: null,
    playbackRate: 1, error: '',
  });
  let verses: readonly Readonly<{ verse: number; text: string }>[] = Object.freeze([]);
  let index = 0;
  let generation = 0;
  let activeUtterance: SpeechUtteranceLike | null = null;
  let disposed = false;

  const publish = (patch: Partial<ReaderSpeechSnapshot>) => {
    state = freezeSnapshot({ ...state, ...patch });
    for (const listener of listeners) listener(state);
    return state;
  };

  const speakCurrent = (pass: number) => {
    if (!available || !synthesis || !createUtterance || pass !== generation) return;
    const verse = verses[index];
    if (!verse) {
      activeUtterance = null;
      publish({ status: 'ended', currentVerse: null, error: '' });
      return;
    }
    try {
      const utterance = createUtterance(verse.text);
      utterance.lang = LANGUAGE_BY_TRANSLATION[state.translationId as ReaderTranslationId] || 'en';
      utterance.rate = state.playbackRate;
      utterance.onstart = () => {
        if (pass === generation) publish({ status: 'speaking', currentVerse: verse.verse, error: '' });
      };
      utterance.onend = () => {
        if (pass !== generation) return;
        index += 1;
        speakCurrent(pass);
      };
      utterance.onerror = (event) => {
        if (pass !== generation) return;
        generation += 1;
        activeUtterance = null;
        publish({ status: 'error', error: String(event?.error || 'Browser speech could not read this verse.') });
      };
      activeUtterance = utterance;
      synthesis.speak(utterance);
    } catch (error) {
      activeUtterance = null;
      publish({ status: 'error', error: error instanceof Error ? error.message : 'Browser speech could not start.' });
    }
  };

  return Object.freeze({
    isAvailable: () => available && !disposed,
    getState: () => state,
    subscribe(listener: (snapshot: ReaderSpeechSnapshot) => void) {
      if (typeof listener !== 'function') throw new Error('Reader speech subscription requires a callback.');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    loadChapter(chapter: ReaderChapter) {
      if (disposed) throw new Error('Browser speech provider has been disposed.');
      if (!available) return state;
      const language = LANGUAGE_BY_TRANSLATION[chapter?.translationId];
      if (!language) throw new Error('Browser speech is available only for the Tagalog, Cebuano, and Japanese Reader text.');
      if (!chapter.book?.code || !Number.isInteger(chapter.chapter) || chapter.chapter < 1
        || !Number.isInteger(chapter.book.chapters) || chapter.chapter > chapter.book.chapters
        || !Array.isArray(chapter.verses) || chapter.verses.length === 0) {
        throw new Error('Browser speech requires a complete Reader chapter.');
      }
      let previousVerse = 0;
      const nextVerses = Object.freeze(chapter.verses.map((verse) => {
        if (verse.chapter !== chapter.chapter || !Number.isInteger(verse.verse) || verse.verse <= previousVerse || !verse.text.trim()) {
          throw new Error('Browser speech rejected a malformed verse.');
        }
        previousVerse = verse.verse;
        return Object.freeze({ verse: verse.verse, text: verse.text });
      }));
      const sameChapter = state.translationId === chapter.translationId && state.bookCode === chapter.book.code
        && state.chapter === chapter.chapter;
      if (sameChapter) return state;
      generation += 1;
      synthesis!.cancel();
      activeUtterance = null;
      index = 0;
      verses = nextVerses;
      return publish({ status: 'ready', translationId: chapter.translationId, bookCode: chapter.book.code,
        chapter: chapter.chapter, currentVerse: null, error: '' });
    },
    play() {
      if (!available || disposed || !state.translationId) throw new Error('Browser speech is unavailable for this Reader chapter.');
      if (state.status === 'paused') {
        synthesis!.resume();
        return publish({ status: 'speaking', error: '' });
      }
      if (state.status === 'speaking') return state;
      if (state.status === 'ended' || state.status === 'error') index = 0;
      if (!verses.length) throw new Error('Choose a text chapter before starting browser speech.');
      generation += 1;
      publish({ status: 'ready', currentVerse: null, error: '' });
      speakCurrent(generation);
      return state;
    },
    pause() {
      if (disposed) return state;
      if (state.status !== 'speaking') return state;
      synthesis!.pause();
      return publish({ status: 'paused' });
    },
    resume() {
      if (disposed) return state;
      if (state.status !== 'paused') return state;
      synthesis!.resume();
      return publish({ status: 'speaking' });
    },
    stop() {
      if (!available || disposed) return state;
      generation += 1;
      synthesis!.cancel();
      activeUtterance = null;
      index = 0;
      return publish({ status: state.translationId ? 'ready' : 'idle', currentVerse: null, error: '' });
    },
    setPlaybackRate(rate: number) {
      if (disposed) throw new Error('Browser speech provider has been disposed.');
      const value = Number(rate);
      if (!Number.isFinite(value) || value < MIN_RATE || value > MAX_RATE) {
        throw new Error(`Browser speech rate must be from ${MIN_RATE}× to ${MAX_RATE}×.`);
      }
      if (activeUtterance) activeUtterance.rate = value;
      return publish({ playbackRate: value });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      generation += 1;
      if (available) synthesis!.cancel();
      activeUtterance = null;
      verses = Object.freeze([]);
      listeners.clear();
    },
  });
}

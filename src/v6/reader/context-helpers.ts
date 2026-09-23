import type {
  ReaderChapter,
  ReaderContext,
  ReaderLocation,
  ReaderTranslationId,
  ReaderVerse,
  ScriptureContentProvider,
} from './contracts.ts';

export type ReaderVersePeek = Readonly<{
  translationId: ReaderTranslationId;
  bookCode: string;
  chapter: number;
  verse: number;
  reference: string;
  scripture: ReaderVerse;
  previous: ReaderVerse | null;
  next: ReaderVerse | null;
  canOpenContextLab: boolean;
}>;

export type ReaderContextLabRequest = ReaderLocation & Readonly<{ verse: number }>;

function positiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function containsVerse(candidate: ReaderVerse, verse: number): boolean {
  const end = candidate.verseEnd ?? candidate.verse;
  return candidate.verse <= verse && verse <= end;
}

function referenceLabel(chapter: ReaderChapter, verse: ReaderVerse): string {
  const verseLabel = verse.verseEnd && verse.verseEnd !== verse.verse
    ? `${verse.verse}-${verse.verseEnd}`
    : `${verse.verse}`;
  return `${chapter.book.name} ${chapter.chapter}:${verseLabel}`;
}

/**
 * DOM-independent Verse Peek projection. It deliberately consumes an already
 * loaded chapter so opening a peek never changes translation/navigation state.
 */
export function deriveVersePeek(
  chapter: ReaderChapter,
  requestedVerse: number,
): ReaderVersePeek | null {
  if (!positiveInteger(requestedVerse) || !positiveInteger(chapter.chapter)) return null;

  const index = chapter.verses.findIndex((candidate) => containsVerse(candidate, requestedVerse));
  if (index < 0) return null;

  const scripture = chapter.verses[index];
  if (!scripture || !scripture.text.trim()) return null;

  return Object.freeze({
    translationId: chapter.translationId,
    bookCode: chapter.book.code,
    chapter: chapter.chapter,
    verse: requestedVerse,
    reference: referenceLabel(chapter, scripture),
    scripture,
    previous: index > 0 ? chapter.verses[index - 1] ?? null : null,
    next: index + 1 < chapter.verses.length ? chapter.verses[index + 1] ?? null : null,
    canOpenContextLab: true,
  });
}

/**
 * Context Lab is verse-scoped and must preserve the exact Reader translation
 * and location. Invalid/incomplete locations fail closed instead of guessing.
 */
export function toContextLabRequest(location: ReaderLocation): ReaderContextLabRequest | null {
  if (
    !location.bookCode.trim()
    || !positiveInteger(location.chapter)
    || location.verse === undefined
    || !positiveInteger(location.verse)
  ) {
    return null;
  }

  return Object.freeze({
    translationId: location.translationId,
    bookCode: location.bookCode,
    chapter: location.chapter,
    verse: location.verse,
  });
}

/** Read-only bridge for migration tests; Scripture provider remains the owner. */
export async function loadContextLab(
  provider: ScriptureContentProvider,
  location: ReaderLocation,
): Promise<ReaderContext | null> {
  const request = toContextLabRequest(location);
  if (!request) return null;
  return provider.loadContext(request);
}

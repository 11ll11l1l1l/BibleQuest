import type {
  ReaderChapter,
  ReaderContext,
  ReaderLocation,
  ReaderSearchResult,
  ReaderTranslationId,
  ScriptureContentProvider,
} from './contracts.ts';

export type ScriptureRepositoryFailure = 'invalid-location' | 'mismatched-content' | 'unavailable';

export type ScriptureRepositoryResult<T> =
  | Readonly<{ status: 'ready'; value: T }>
  | Readonly<{ status: 'failed'; reason: ScriptureRepositoryFailure; retryable: boolean }>;

function positiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function validLocation(location: ReaderLocation): boolean {
  return Boolean(location.bookCode.trim()) && positiveInteger(location.chapter);
}

function containsVerse(candidate: Readonly<{ verse: number; verseEnd?: number }>, verse: number): boolean {
  const end = candidate.verseEnd ?? candidate.verse;
  return positiveInteger(candidate.verse) && positiveInteger(end) && candidate.verse <= verse && verse <= end;
}

function chapterMatches(location: ReaderLocation, chapter: ReaderChapter): boolean {
  if (chapter.translationId !== location.translationId) return false;
  if (chapter.book.code.trim().toUpperCase() !== location.bookCode.trim().toUpperCase()) return false;
  if (!positiveInteger(chapter.book.chapters) || chapter.chapter > chapter.book.chapters) return false;
  if (chapter.chapter !== location.chapter || !positiveInteger(chapter.chapter)) return false;
  if (chapter.verses.length === 0) return false;

  let previousEnd = 0;
  for (const verse of chapter.verses) {
    const end = verse.verseEnd ?? verse.verse;
    if (
      verse.chapter !== chapter.chapter
      || !positiveInteger(verse.verse)
      || !positiveInteger(end)
      || end < verse.verse
      || verse.verse <= previousEnd
      || !verse.text.trim()
    ) return false;
    previousEnd = end;
  }
  return true;
}

function contextMatches(location: ReaderLocation & Readonly<{ verse: number }>, context: ReaderContext): boolean {
  if (!context.available) return true;
  if (context.book.code.trim().toUpperCase() !== location.bookCode.trim().toUpperCase()) return false;
  if (context.chapter !== location.chapter || context.verse !== location.verse) return false;
  if (context.scripture.chapter !== location.chapter || !containsVerse(context.scripture, location.verse)) return false;
  return Boolean(context.scripture.text.trim());
}

function searchResultMatches(query: string, limit: number, result: ReaderSearchResult): boolean {
  if (result.query.trim().replace(/\s+/g, ' ') !== query) return false;
  if (result.type !== 'reference' && result.type !== 'text') return false;
  if (result.results.length > limit) return false;

  for (const hit of result.results) {
    const end = hit.verseEnd ?? hit.verse;
    if (
      !hit.book.code.trim()
      || !hit.book.name.trim()
      || !positiveInteger(hit.book.chapters)
      || !positiveInteger(hit.chapter)
      || hit.chapter > hit.book.chapters
      || !positiveInteger(hit.verse)
      || !positiveInteger(end)
      || end < hit.verse
      || !hit.text.trim()
      || !hit.reference.trim()
    ) return false;
  }

  for (const skipped of result.skippedBooks) {
    if (!skipped.code.trim() || !skipped.message.trim()) return false;
  }
  return true;
}

/**
 * DOM-independent Reader repository seam. It keeps the route/view from owning
 * Scripture transport and rejects provider payloads for a different passage or
 * translation instead of silently presenting mismatched Scripture.
 */
export class ScriptureRepository {
  private readonly provider: ScriptureContentProvider;

  constructor(provider: ScriptureContentProvider) {
    this.provider = provider;
  }

  async loadChapter(location: ReaderLocation): Promise<ScriptureRepositoryResult<ReaderChapter>> {
    if (!validLocation(location)) {
      return Object.freeze({ status: 'failed', reason: 'invalid-location', retryable: false });
    }
    try {
      const chapter = await this.provider.loadChapter(location);
      if (!chapterMatches(location, chapter)) {
        return Object.freeze({ status: 'failed', reason: 'mismatched-content', retryable: true });
      }
      return Object.freeze({ status: 'ready', value: chapter });
    } catch {
      return Object.freeze({ status: 'failed', reason: 'unavailable', retryable: true });
    }
  }

  async loadContext(
    location: ReaderLocation & Readonly<{ verse: number }>,
  ): Promise<ScriptureRepositoryResult<ReaderContext>> {
    if (!validLocation(location) || !positiveInteger(location.verse)) {
      return Object.freeze({ status: 'failed', reason: 'invalid-location', retryable: false });
    }
    try {
      const context = await this.provider.loadContext(location);
      if (!contextMatches(location, context)) {
        return Object.freeze({ status: 'failed', reason: 'mismatched-content', retryable: true });
      }
      return Object.freeze({ status: 'ready', value: context });
    } catch {
      return Object.freeze({ status: 'failed', reason: 'unavailable', retryable: true });
    }
  }

  async search(
    translationId: ReaderTranslationId,
    query: string,
    limit = 50,
  ): Promise<ScriptureRepositoryResult<ReaderSearchResult>> {
    const normalized = query.trim().replace(/\s+/g, ' ');
    if (!normalized || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      return Object.freeze({ status: 'failed', reason: 'invalid-location', retryable: false });
    }
    try {
      const result = await this.provider.search(translationId, normalized, limit);
      if (!searchResultMatches(normalized, limit, result)) {
        return Object.freeze({ status: 'failed', reason: 'mismatched-content', retryable: true });
      }
      return Object.freeze({ status: 'ready', value: result });
    } catch {
      return Object.freeze({ status: 'failed', reason: 'unavailable', retryable: true });
    }
  }
}

import type {
  ReaderChapter,
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

function chapterMatches(location: ReaderLocation, chapter: ReaderChapter): boolean {
  if (chapter.translationId !== location.translationId) return false;
  if (chapter.book.code.trim().toUpperCase() !== location.bookCode.trim().toUpperCase()) return false;
  if (chapter.chapter !== location.chapter || !positiveInteger(chapter.chapter)) return false;
  return chapter.verses.every((verse) => {
    const end = verse.verseEnd ?? verse.verse;
    return verse.chapter === chapter.chapter
      && positiveInteger(verse.verse)
      && positiveInteger(end)
      && end >= verse.verse
      && Boolean(verse.text.trim());
  });
}

/**
 * DOM-independent Reader repository seam. It keeps the route/view from owning
 * Scripture transport and rejects provider payloads for a different passage or
 * translation instead of silently presenting mismatched Scripture.
 */
export class ScriptureRepository {
  constructor(private readonly provider: ScriptureContentProvider) {}

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
      if (result.query.trim().replace(/\s+/g, ' ') !== normalized) {
        return Object.freeze({ status: 'failed', reason: 'mismatched-content', retryable: true });
      }
      return Object.freeze({ status: 'ready', value: result });
    } catch {
      return Object.freeze({ status: 'failed', reason: 'unavailable', retryable: true });
    }
  }
}

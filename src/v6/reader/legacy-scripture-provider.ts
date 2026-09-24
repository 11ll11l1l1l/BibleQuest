import type {
  ReaderBookRef,
  ReaderContext,
  ReaderSearchResult,
  ReaderLocation,
  ReaderTranslationId,
  ReaderVerse,
  ScriptureContentProvider,
} from './contracts.ts';

export type LegacyBibleTranslation = Readonly<{
  id: string;
  [key: string]: unknown;
}>;

export type LegacyBibleChapter = Readonly<{
  book: ReaderBookRef;
  chapter: number;
  translation: LegacyBibleTranslation;
  verses: readonly ReaderVerse[];
  [key: string]: unknown;
}>;

export interface LegacyBibleDataService {
  loadChapter(translationId: string, bookCode: string, chapter: number): Promise<LegacyBibleChapter>;
  search(
    translationId: string,
    query: string,
    options?: Readonly<{ limit?: number }>,
  ): Promise<ReaderSearchResult>;
  lexicalContext(bookCode: string, chapter: number, verse: number): Promise<ReaderContext>;
}

/**
 * Compatibility adapter for incremental Reader migration.
 *
 * It deliberately does not catch or remap legacy errors: provider-level error
 * messages/licensing failures remain available to legacy callers while the
 * ScriptureRepository can impose its own fail-closed result contract where
 * explicitly adopted.
 */
export function createLegacyBibleScriptureProvider(
  bible: LegacyBibleDataService,
): ScriptureContentProvider {
  return Object.freeze({
    async loadChapter(location: ReaderLocation) {
      const loaded = await bible.loadChapter(
        location.translationId,
        location.bookCode,
        location.chapter,
      );
      return Object.freeze({
        ...loaded,
        translationId: location.translationId,
      });
    },

    async search(translationId: ReaderTranslationId, query: string, limit?: number) {
      return bible.search(
        translationId,
        query,
        limit === undefined ? undefined : { limit },
      );
    },

    async loadContext(location: ReaderLocation & Readonly<{ verse: number }>) {
      if (location.translationId !== 'bsb') {
        throw new Error('Context Lab Scripture is BSB-only; choose BSB explicitly for original-language context.');
      }
      return bible.lexicalContext(
        location.bookCode,
        location.chapter,
        location.verse,
      );
    },
  });
}

import type { ReaderBookRef, ReaderLocation, ReaderTranslationId } from './contracts.js';

export type ReaderNavigationCatalog = ReadonlyMap<string, ReaderBookRef>;

export function normalizeReaderLocation(
  location: ReaderLocation,
  catalog: ReaderNavigationCatalog,
): ReaderLocation {
  const book = catalog.get(location.bookCode.toUpperCase());
  if (!book) throw new Error(`Unknown Bible book: ${location.bookCode || 'missing'}.`);
  if (!Number.isInteger(location.chapter) || location.chapter < 1 || location.chapter > book.chapters) {
    throw new Error(`Invalid chapter ${location.chapter} for ${book.name}.`);
  }
  if (location.verse !== undefined && (!Number.isInteger(location.verse) || location.verse < 1)) {
    throw new Error(`Invalid verse ${location.verse}.`);
  }
  return Object.freeze({ ...location, bookCode: book.code });
}

/**
 * Translation changes preserve the current Scripture reference. Availability is
 * resolved by the content provider; this helper must never substitute content.
 */
export function switchReaderTranslation(
  location: ReaderLocation,
  translationId: ReaderTranslationId,
  catalog: ReaderNavigationCatalog,
): ReaderLocation {
  return normalizeReaderLocation({ ...location, translationId }, catalog);
}

/** Chapter movement is bounded to the current book and clears a verse anchor. */
export function moveReaderChapter(
  location: ReaderLocation,
  delta: -1 | 1,
  catalog: ReaderNavigationCatalog,
): ReaderLocation | null {
  const current = normalizeReaderLocation(location, catalog);
  const book = catalog.get(current.bookCode)!;
  const chapter = current.chapter + delta;
  if (chapter < 1 || chapter > book.chapters) return null;
  return Object.freeze({
    translationId: current.translationId,
    bookCode: current.bookCode,
    chapter,
  });
}

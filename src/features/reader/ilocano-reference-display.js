import { ilocanoReaderBookName } from './ilocano-book-titles.js';

// Presentation-only reference names from the verified Ilocano ULB publisher
// index. Canonical search/navigation/verse identity is never rewritten.
export function displayIlocanoReaderReference(book, chapter, verse = null, verseEnd = null, fallback = '') {
  const name = ilocanoReaderBookName(book?.code, '');
  if (!name || !Number.isInteger(chapter) || chapter < 1
      || (verse !== null && (!Number.isInteger(verse) || verse < 1))
      || (verseEnd !== null && (!Number.isInteger(verseEnd) || verseEnd < (verse ?? 1)))) return fallback;
  const range = verse === null ? '' : `:${verse}${verseEnd !== null && verseEnd > verse ? `–${verseEnd}` : ''}`;
  return `${name} ${chapter}${range}`;
}

export function displayIlocanoReaderSearch(result) {
  if (!result || !Array.isArray(result.results)) return result;
  return {
    ...result,
    results: result.results.map(hit => ({
      ...hit,
      reference: displayIlocanoReaderReference(hit.book, hit.chapter, hit.verse, hit.verseEnd ?? null, hit.reference),
    })),
  };
}

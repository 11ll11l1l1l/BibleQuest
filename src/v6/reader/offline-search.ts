import type { ReaderBookRef, ReaderSearchResult, ReaderTranslationId } from './contracts.ts';
import { offlineScriptureEligibility } from './offline-availability.ts';
import type { InstalledScripturePackage } from './package-manager.ts';

export interface InstalledScriptureSearchRepository {
  listInstalled(translationId: string): Promise<readonly InstalledScripturePackage[]>;
  readInstalledPayload(translationId: string, bookCode: string): Promise<ArrayBuffer | null>;
}

type RawPackVerse = Readonly<{
  c?: unknown;
  v?: unknown;
  e?: unknown;
  t?: unknown;
}>;

type OfflineVerse = Readonly<{
  chapter: number;
  verse: number;
  verseEnd?: number;
  text: string;
}>;

const MAX_RESULTS = 100;

function normalizeQuery(query: string): string {
  return String(query ?? '').trim().replace(/\s+/g, ' ');
}

function positiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function decodeInstalledPack(payload: ArrayBuffer, book: ReaderBookRef): readonly OfflineVerse[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(payload));
  } catch {
    throw new Error(`Installed Scripture package for ${book.name} is malformed.`);
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`Installed Scripture package for ${book.name} contains no readable verses.`);
  }

  const verses: OfflineVerse[] = [];
  const seen = new Set<string>();
  for (const raw of parsed as RawPackVerse[]) {
    const chapter = Number(raw?.c);
    const verse = Number(raw?.v);
    const end = raw?.e === undefined ? verse : Number(raw.e);
    const text = String(raw?.t ?? '').trim();

    if (
      !positiveInteger(chapter)
      || chapter > book.chapters
      || !positiveInteger(verse)
      || !positiveInteger(end)
      || end < verse
      || !text
    ) {
      throw new Error(`Installed Scripture package for ${book.name} contains invalid verse metadata.`);
    }

    for (let number = verse; number <= end; number += 1) {
      const key = `${chapter}:${number}`;
      if (seen.has(key)) {
        throw new Error(`Installed Scripture package for ${book.name} contains duplicate or overlapping verses.`);
      }
      seen.add(key);
    }

    verses.push(Object.freeze({
      chapter,
      verse,
      ...(end > verse ? { verseEnd: end } : {}),
      text,
    }));
  }

  verses.sort((a, b) => a.chapter - b.chapter || a.verse - b.verse);
  return Object.freeze(verses);
}

function reference(book: ReaderBookRef, verse: OfflineVerse): string {
  const end = verse.verseEnd ?? verse.verse;
  return `${book.name} ${verse.chapter}:${verse.verse}${end > verse.verse ? `-${end}` : ''}`;
}

/**
 * Offline text-search boundary over deliberately installed Scripture packages.
 *
 * It has no transport/fetch dependency and therefore cannot escape to network
 * or silently scan uninstalled books. Live/external/review-required
 * translations fail closed before repository reads.
 */
export class OfflineScriptureSearch {
  readonly #repository: InstalledScriptureSearchRepository;
  readonly #books: ReadonlyMap<string, ReaderBookRef>;

  constructor(repository: InstalledScriptureSearchRepository, books: readonly ReaderBookRef[]) {
    this.#repository = repository;
    this.#books = new Map(
      books.map((book) => [book.code.trim().toUpperCase(), Object.freeze({ ...book })]),
    );
  }

  async searchText(
    translationId: ReaderTranslationId,
    query: string,
    limit = 50,
  ): Promise<ReaderSearchResult> {
    const normalized = normalizeQuery(query);
    if (normalized.length < 3) {
      throw new Error('Offline Scripture search needs at least 3 characters.');
    }
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_RESULTS) {
      throw new Error(`Offline Scripture search limit must be between 1 and ${MAX_RESULTS}.`);
    }

    const eligibility = offlineScriptureEligibility(translationId);
    if (!eligibility.eligible) {
      throw new Error(`Offline Scripture search is unavailable for ${translationId}: ${eligibility.reason}.`);
    }

    const installed = await this.#repository.listInstalled(translationId);
    const needle = normalized.toLocaleLowerCase();
    const results: ReaderSearchResult['results'][number][] = [];
    const skippedBooks: ReaderSearchResult['skippedBooks'][number][] = [];
    const seenBooks = new Set<string>();

    for (const record of installed) {
      if (results.length >= limit) break;

      const code = String(record.bookCode ?? '').trim().toUpperCase();
      if (
        record.translationId !== translationId
        || !code
        || seenBooks.has(code)
      ) {
        skippedBooks.push(Object.freeze({
          code: code || 'UNKNOWN',
          message: 'Installed package metadata does not match the offline search request.',
        }));
        continue;
      }
      seenBooks.add(code);

      const book = this.#books.get(code);
      if (!book) {
        skippedBooks.push(Object.freeze({
          code,
          message: 'Installed package book metadata is unavailable.',
        }));
        continue;
      }

      let payload: ArrayBuffer | null;
      try {
        payload = await this.#repository.readInstalledPayload(translationId, code);
      } catch {
        payload = null;
      }
      if (!payload) {
        skippedBooks.push(Object.freeze({
          code,
          message: 'Installed package bytes are unavailable.',
        }));
        continue;
      }

      try {
        const verses = decodeInstalledPack(payload, book);
        for (const verse of verses) {
          if (!verse.text.toLocaleLowerCase().includes(needle)) continue;
          results.push(Object.freeze({
            book,
            chapter: verse.chapter,
            verse: verse.verse,
            ...(verse.verseEnd === undefined ? {} : { verseEnd: verse.verseEnd }),
            text: verse.text,
            reference: reference(book, verse),
          }));
          if (results.length >= limit) break;
        }
      } catch (error) {
        skippedBooks.push(Object.freeze({
          code,
          message: error instanceof Error ? error.message : 'Installed Scripture package is unreadable.',
        }));
      }
    }

    return Object.freeze({
      query: normalized,
      type: 'text',
      results: Object.freeze(results),
      skippedBooks: Object.freeze(skippedBooks),
    });
  }
}

import type { ReaderSearchResult } from './contracts.ts';

export type ReaderSearchPresentationItem = Readonly<{
  index: number;
  reference: string;
  text: string;
}>;

export type ReaderSearchPresentation = Readonly<{
  heading: string;
  countLabel: string | null;
  emptyMessage: string | null;
  warning: string | null;
  items: readonly ReaderSearchPresentationItem[];
}>;

function requiredText(value: string, label: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new Error(`Reader search presentation requires ${label}.`);
  return normalized;
}

/**
 * Pure Search presentation seam.
 *
 * It deliberately returns text-only UI data. HTML escaping remains the live
 * route's responsibility so this model is independently testable without DOM
 * ownership or markup generation.
 */
export function presentReaderSearchResults(result: ReaderSearchResult): ReaderSearchPresentation {
  if (!result || !Array.isArray(result.results) || !Array.isArray(result.skippedBooks)) {
    throw new Error('Reader search presentation requires a valid search result.');
  }

  const items = result.results.map((hit, index) => {
    if (
      !hit
      || !Number.isInteger(hit.chapter)
      || hit.chapter < 1
      || !Number.isInteger(hit.verse)
      || hit.verse < 1
    ) {
      throw new Error('Reader search presentation rejected an invalid Scripture location.');
    }
    return Object.freeze({
      index,
      reference: requiredText(hit.reference, 'a Scripture reference'),
      text: requiredText(hit.text, 'non-blank Scripture text'),
    });
  });

  const skipped = result.skippedBooks.length;
  return Object.freeze({
    heading: 'Search results',
    countLabel: items.length ? `${items.length} shown` : null,
    emptyMessage: items.length ? null : 'No matches found.',
    warning: skipped ? `${skipped} book pack(s) were unavailable during this search.` : null,
    items: Object.freeze(items),
  });
}

import type {
  ReaderSearchResult,
  ReaderTranslationId,
  ScriptureContentProvider,
} from './contracts.ts';

export type ReaderSearchRequest = Readonly<{
  translationId: ReaderTranslationId;
  query: string;
  limit?: number;
}>;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * Normalizes Reader search input without interpreting Scripture or guessing a
 * reference. Blank input and invalid limits fail closed before provider I/O.
 */
export function normalizeReaderSearchRequest(
  request: ReaderSearchRequest,
): Required<ReaderSearchRequest> | null {
  const query = request.query.trim();
  if (!query) return null;

  const limit = request.limit ?? DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit <= 0 || limit > MAX_LIMIT) return null;

  return Object.freeze({
    translationId: request.translationId,
    query,
    limit,
  });
}

/**
 * DOM-independent search bridge. The provider remains responsible for
 * translation-specific reference parsing/text lookup and licensing behavior.
 */
export async function searchReader(
  provider: ScriptureContentProvider,
  request: ReaderSearchRequest,
): Promise<ReaderSearchResult | null> {
  const normalized = normalizeReaderSearchRequest(request);
  if (!normalized) return null;
  return provider.search(normalized.translationId, normalized.query, normalized.limit);
}

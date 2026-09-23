import type { ReaderLocation } from './contracts.ts';
import type { JapaneseEnrichmentProvider, JapaneseVerseEnrichment, ScriptureReference } from './japanese-enrichment.ts';
import { canUseJapaneseEnrichment, normalizeJapaneseEnrichment } from './japanese-enrichment.ts';

export type JapaneseEnrichmentFailure = 'unsupported-translation' | 'invalid-reference' | 'unavailable';

export type JapaneseEnrichmentState =
  | Readonly<{ status: 'ready'; enrichment: JapaneseVerseEnrichment }>
  | Readonly<{ status: 'empty' }>
  | Readonly<{ status: 'failed'; reason: JapaneseEnrichmentFailure; retryable: boolean }>;

function toReference(location: ReaderLocation): ScriptureReference | null {
  const bookCode = String(location.bookCode || '').trim();
  if (!bookCode || !Number.isInteger(location.chapter) || location.chapter < 1) return null;
  if (location.verse !== undefined && (!Number.isInteger(location.verse) || location.verse < 1)) return null;
  return Object.freeze({ bookCode, chapter: location.chapter, ...(location.verse === undefined ? {} : { verse: location.verse }) });
}

export async function loadJapaneseEnrichment(
  provider: JapaneseEnrichmentProvider,
  location: ReaderLocation,
): Promise<JapaneseEnrichmentState> {
  if (!canUseJapaneseEnrichment(location.translationId)) {
    return Object.freeze({ status: 'failed', reason: 'unsupported-translation', retryable: false });
  }
  const reference = toReference(location);
  if (!reference) return Object.freeze({ status: 'failed', reason: 'invalid-reference', retryable: false });

  try {
    const value = await provider.getVerseEnrichment(reference);
    if (!value) return Object.freeze({ status: 'empty' });
    const enrichment = normalizeJapaneseEnrichment(value);
    if (enrichment.reference.bookCode !== reference.bookCode || enrichment.reference.chapter !== reference.chapter || enrichment.reference.verse !== reference.verse) {
      return Object.freeze({ status: 'failed', reason: 'unavailable', retryable: true });
    }
    return Object.freeze({ status: 'ready', enrichment });
  } catch {
    return Object.freeze({ status: 'failed', reason: 'unavailable', retryable: true });
  }
}

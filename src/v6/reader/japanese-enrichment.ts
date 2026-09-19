import type { ReaderLocation, ReaderTranslationId } from './contracts.ts';

export type ScriptureReference = Readonly<Omit<ReaderLocation, 'translationId'>>;

export type JapaneseReadingSegment = Readonly<{
  surface: string;
  reading?: string;
}>;

export type JapaneseVocabularyEntry = Readonly<{
  surface: string;
  reading?: string;
  gloss: string;
  source: string;
}>;

export type JapaneseVerseEnrichment = Readonly<{
  translationId: 'jko';
  reference: ScriptureReference;
  segments: readonly JapaneseReadingSegment[];
  vocabulary: readonly JapaneseVocabularyEntry[];
}>;

export interface JapaneseEnrichmentProvider {
  getVerseEnrichment(reference: ScriptureReference): Promise<JapaneseVerseEnrichment | null>;
}

export function canUseJapaneseEnrichment(translationId: ReaderTranslationId): translationId is 'jko' {
  return translationId === 'jko';
}

export function normalizeJapaneseEnrichment(
  value: JapaneseVerseEnrichment,
): JapaneseVerseEnrichment {
  if (value.translationId !== 'jko') throw new Error('Japanese enrichment must belong to jko.');
  if (!value.reference.bookCode || !Number.isInteger(value.reference.chapter) || value.reference.chapter < 1) {
    throw new Error('Japanese enrichment requires a valid Scripture reference.');
  }
  const segments = value.segments.map(segment => Object.freeze({
    surface: String(segment.surface || '').trim(),
    ...(segment.reading ? { reading: String(segment.reading).trim() } : {}),
  })).filter(segment => segment.surface);
  const vocabulary = value.vocabulary.map(entry => Object.freeze({
    surface: String(entry.surface || '').trim(),
    ...(entry.reading ? { reading: String(entry.reading).trim() } : {}),
    gloss: String(entry.gloss || '').trim(),
    source: String(entry.source || '').trim(),
  })).filter(entry => entry.surface && entry.gloss && entry.source);
  return Object.freeze({
    translationId: 'jko',
    reference: Object.freeze({ ...value.reference }),
    segments: Object.freeze(segments),
    vocabulary: Object.freeze(vocabulary),
  });
}

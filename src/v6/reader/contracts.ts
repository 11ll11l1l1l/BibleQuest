export type ReaderTranslationId = 'bsb' | 'tl' | 'cebocb' | 'jko' | 'nlt';

export type ReaderBookRef = Readonly<{
  code: string;
  name: string;
  chapters: number;
}>;

export type ReaderLocation = Readonly<{
  translationId: ReaderTranslationId;
  bookCode: string;
  chapter: number;
  verse?: number;
}>;

export type ReaderVerse = Readonly<{
  chapter: number;
  verse: number;
  verseEnd?: number;
  text: string;
}>;

export type ReaderChapter = Readonly<{
  translationId: ReaderTranslationId;
  book: ReaderBookRef;
  chapter: number;
  verses: readonly ReaderVerse[];
}>;

export type ReaderSearchHit = Readonly<{
  book: ReaderBookRef;
  chapter: number;
  verse: number;
  verseEnd?: number;
  text: string;
  reference: string;
}>;

export type ReaderSearchResult = Readonly<{
  query: string;
  type: 'reference' | 'text';
  results: readonly ReaderSearchHit[];
  skippedBooks: readonly Readonly<{ code: string; message: string }>[];
}>;

export type ReaderLexicalEntry = Readonly<{
  strong: string;
  language: string;
  lemma: string;
  transliteration: string;
  morphology: string;
  gloss: string;
  usageTotal: number;
  usages: readonly Readonly<{ code: string; chapter: number; verse: number; reference: string }>[];
}>;

export type ReaderContext = Readonly<{
  available: boolean;
  reason: string;
  book: ReaderBookRef;
  chapter: number;
  verse: number;
  reference: string;
  scripture: ReaderVerse;
  previous: ReaderVerse | null;
  next: ReaderVerse | null;
  entries: readonly ReaderLexicalEntry[];
  source: string;
  license: string;
  note: string;
  external: readonly Readonly<{ id: string; label: string; href: string }>[];
}>;

/**
 * Read-only Scripture boundary introduced beside the V5 Reader owner.
 * Implementations must preserve V5 licensing and unavailable-state behavior;
 * this contract does not authorize bundling or caching any translation.
 */
export interface ScriptureContentProvider {
  loadChapter(location: ReaderLocation): Promise<ReaderChapter>;
  search(translationId: ReaderTranslationId, query: string, limit?: number): Promise<ReaderSearchResult>;
  loadContext(location: ReaderLocation & Readonly<{ verse: number }>): Promise<ReaderContext>;
}

export type ReaderProgress = Readonly<{
  location: ReaderLocation;
  readAt: string;
}>;

/** Progress is intentionally a separate command owner from Scripture delivery. */
export interface ReaderProgressRepository {
  readLastPosition(): Promise<ReaderProgress | null>;
  recordRead(progress: ReaderProgress): Promise<void>;
}

/** Japanese enrichment remains optional and independent from Scripture ownership. */
export interface JapaneseReaderEnrichmentProvider {
  annotateFurigana(text: string): Promise<readonly Readonly<{ surface: string; reading?: string }>[] >;
  lookupVocabulary(term: string): Promise<Readonly<{ term: string; reading?: string; glosses: readonly string[] }> | null>;
}

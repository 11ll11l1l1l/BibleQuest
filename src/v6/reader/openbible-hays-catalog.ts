import type { ReaderBookRef } from './contracts.ts';
import type { ScriptureAudioManifest } from './audio-policy.ts';
import { validateChapterAlignment, type ScriptureChapterAlignment } from './audio-alignment.ts';

const OPENBIBLE_BOOK_TOKENS: Readonly<Record<string, string>> = Object.freeze({
  GEN:'Gen',EXO:'Exo',LEV:'Lev',NUM:'Num',DEU:'Deu',JOS:'Jos',JDG:'Jdg',RUT:'Rut','1SA':'1Sa','2SA':'2Sa',
  '1KI':'1Ki','2KI':'2Ki','1CH':'1Ch','2CH':'2Ch',EZR:'Ezr',NEH:'Neh',EST:'Est',JOB:'Job',PSA:'Psa',PRO:'Pro',
  ECC:'Ecc',SNG:'Sng',ISA:'Isa',JER:'Jer',LAM:'Lam',EZK:'Ezk',DAN:'Dan',HOS:'Hos',JOL:'Jol',AMO:'Amo',OBA:'Oba',
  JON:'Jon',MIC:'Mic',NAM:'Nam',HAB:'Hab',ZEP:'Zep',HAG:'Hag',ZEC:'Zec',MAL:'Mal',MAT:'Mat',MRK:'Mrk',LUK:'Luk',
  JHN:'Jhn',ACT:'Act',ROM:'Rom','1CO':'1Co','2CO':'2Co',GAL:'Gal',EPH:'Eph',PHP:'Php',COL:'Col','1TH':'1Th','2TH':'2Th',
  '1TI':'1Ti','2TI':'2Ti',TIT:'Tit',PHM:'Phm',HEB:'Heb',JAS:'Jas','1PE':'1Pe','2PE':'2Pe','1JN':'1Jn','2JN':'2Jn',
  '3JN':'3Jn',JUD:'Jud',REV:'Rev',
});

export type OpenBibleBsbNarrator = 'hays' | 'souer';
const NARRATORS = Object.freeze({
  hays: Object.freeze({ name: 'Barry Hays', directory: 'hays', suffix: '_H' }),
  souer: Object.freeze({ name: 'Bob Souer', directory: 'souer', suffix: '' }),
});
const OPENBIBLE_LICENSE = 'CC0 1.0 public-domain dedication by the BSB Audio Bible project';
const OPENBIBLE_RIGHTS_EVIDENCE = 'https://audiobible.org/ ; https://biblicalalignment.org/about ; https://openbible.com/audio.htm ; https://openbible.com/terms.htm';
const OPENBIBLE_RIGHTS_REVIEWER = 'BibleQuest V6 content-source review';
const OPENBIBLE_RIGHTS_REVIEWED_AT = '2026-10-02T00:00:00+09:00';
const HAYS_STREAM_CONTENT_VERSION = 'openbible-hays-stream-v1';
const SHA256_CONTENT_VERSION = /^sha256-[a-f0-9]{64}$/i;
const HAYS_ALIGNMENT_PATH = '/data/v6-audio/bsb-hays-alignment.json';
const EXPECTED_BSB_CHAPTERS = 1189;
const SHA256 = /^[a-f0-9]{64}$/i;
const GIT_REVISION = /^[a-f0-9]{40}$/i;

export interface OpenBibleHaysChapterAlignment extends ScriptureChapterAlignment {
  readonly audioSha256: string;
  readonly audioByteLength: number;
}

export interface OpenBibleHaysAlignmentBundle {
  readonly audioContentVersion: string;
  readonly audioInventorySha256: string;
  readonly scriptureContentVersion: string;
  readonly alignmentSource: string;
  readonly alignmentRevision: string;
  readonly inventorySha256: string;
  readonly chapters: readonly OpenBibleHaysChapterAlignment[];
}

/** Build direct chapter URLs without inventing file sizes or checksums. This catalog
 * supports streaming only; offline installation still needs a separately reviewed,
 * checksum-pinned manifest and verified alignment. */
export function createOpenBibleNarratorStreamingManifest(
  narrator: OpenBibleBsbNarrator,
  scriptureContentVersion: string,
  books: readonly ReaderBookRef[],
  alignmentSource?: string | null,
): ScriptureAudioManifest {
  const source = NARRATORS[narrator];
  if (!source) throw new Error('OpenBible BSB audio narrator is unsupported.');
  if (typeof scriptureContentVersion !== 'string' || !scriptureContentVersion.trim()) {
    throw new Error('Current BSB Scripture content version is required for the OpenBible audio catalog.');
  }
  if (!Array.isArray(books) || books.length !== 66) throw new Error('OpenBible BSB audio requires the canonical 66-book inventory.');
  if (alignmentSource !== undefined && alignmentSource !== null) {
    if (narrator !== 'hays' || typeof alignmentSource !== 'string' || !alignmentSource.trim() || alignmentSource !== alignmentSource.trim()) {
      throw new Error('Only the Barry Hays catalog may bind a verified non-blank alignment source.');
    }
  }
  const seen = new Set<string>();
  const segments = books.flatMap(book => {
    const code = String(book?.code ?? '').trim().toUpperCase();
    const token = OPENBIBLE_BOOK_TOKENS[code];
    if (!token || seen.has(code) || !Number.isSafeInteger(book.chapters) || book.chapters < 1) {
      throw new Error(`OpenBible BSB audio has an invalid or duplicate book: ${code || 'missing'}.`);
    }
    seen.add(code);
    const bookNumber = String(Object.keys(OPENBIBLE_BOOK_TOKENS).indexOf(code) + 1).padStart(2, '0');
    return Array.from({ length: book.chapters }, (_, index) => {
      const chapter = index + 1;
      const chapterNumber = String(chapter).padStart(3, '0');
      return Object.freeze({
        id: `${code}-${chapter}`,
        book: code,
        chapter,
        url: `https://openbible.com/audio/${source.directory}/BSB_${bookNumber}_${token}_${chapterNumber}${source.suffix}.mp3`,
      });
    });
  });
  if (seen.size !== 66) throw new Error('OpenBible BSB audio catalog is missing a canonical Bible book.');
  return Object.freeze({
    schemaVersion: 1,
    translationId: 'bsb',
    contentVersion: `openbible-${narrator}-stream-v1`,
    ...(alignmentSource ? { alignmentSource } : {}),
    source: Object.freeze({
      translationId: 'bsb',
      source: `${source.name} BSB narration (OpenBible direct chapter stream)`,
      sourceUrl: `https://openbible.com/audio/${source.directory}/`,
      scriptureContentVersion,
      license: OPENBIBLE_LICENSE,
      rights: 'verified',
      delivery: 'stream',
      textAlignment: 'unverified',
      attribution: `Narrated by ${source.name}; hosted by OpenBible.com`,
      rightsEvidence: OPENBIBLE_RIGHTS_EVIDENCE,
      reviewedBy: OPENBIBLE_RIGHTS_REVIEWER,
      reviewedAt: OPENBIBLE_RIGHTS_REVIEWED_AT,
      permissions: Object.freeze({ stream: 'allowed', offlineCopy: 'allowed' }),
    }),
    segments: Object.freeze(segments),
  });
}

/** Adds checksum-pinned chapter identity from the reviewed Hays timing bundle.
 * Verified CC0 copy permission is already recorded on the source; only a complete
 * exact alignment/audio bundle promotes delivery to downloadable + exact. */
export function bindOpenBibleHaysAlignmentIdentity(
  manifest: ScriptureAudioManifest,
  bundle: OpenBibleHaysAlignmentBundle,
): ScriptureAudioManifest {
  if (manifest.translationId !== 'bsb' || manifest.contentVersion !== HAYS_STREAM_CONTENT_VERSION
    || !SHA256_CONTENT_VERSION.test(bundle.audioContentVersion)
    || bundle.audioContentVersion !== `sha256-${bundle.audioInventorySha256}`
    || manifest.source.scriptureContentVersion !== bundle.scriptureContentVersion
    || manifest.segments.length !== EXPECTED_BSB_CHAPTERS) {
    throw new Error('Hays alignment identity does not match the streaming manifest.');
  }
  const byChapter = new Map(bundle.chapters.map(row => [`${row.book.toUpperCase()}:${row.chapter}`, row]));
  if (byChapter.size !== EXPECTED_BSB_CHAPTERS) throw new Error('Hays alignment identity is incomplete.');
  const segments = manifest.segments.map(segment => {
    const row = byChapter.get(`${segment.book.toUpperCase()}:${segment.chapter}`);
    if (!row) throw new Error('Hays alignment identity is missing an audio chapter.');
    return Object.freeze({ ...segment, sha256: row.audioSha256, byteLength: row.audioByteLength });
  });
  return Object.freeze({
    ...manifest,
    contentVersion: bundle.audioContentVersion,
    alignmentSource: bundle.alignmentSource,
    source: Object.freeze({
      ...manifest.source,
      delivery: 'downloadable',
      textAlignment: 'exact',
    }),
    segments: Object.freeze(segments),
  });
}

export function createOpenBibleHaysStreamingManifest(
  scriptureContentVersion: string,
  books: readonly ReaderBookRef[],
): ScriptureAudioManifest {
  return createOpenBibleNarratorStreamingManifest('hays', scriptureContentVersion, books);
}


export async function loadCurrentBsbScriptureContentVersion(
  fetcher: typeof fetch = globalThis.fetch,
): Promise<string | null> {
  if (typeof fetcher !== 'function') return null;
  try {
    const response = await fetcher('/data/v6-scripture-manifests/bsb.json');
    if (!response.ok) return null;
    const scriptureManifest = await response.json() as { translationId?: unknown; contentVersion?: unknown };
    if (scriptureManifest.translationId !== 'bsb' || typeof scriptureManifest.contentVersion !== 'string') return null;
    const contentVersion = scriptureManifest.contentVersion.trim();
    return contentVersion || null;
  } catch {
    return null;
  }
}

/** Loads only a complete, version-locked Barry Hays timing corpus. A missing, partial,
 * malformed, stale, or narrator-mismatched file deliberately leaves verse sync disabled. */
export async function loadOpenBibleHaysAlignmentBundle(
  scriptureContentVersion: string,
  books: readonly ReaderBookRef[],
  fetcher: typeof fetch = globalThis.fetch,
): Promise<OpenBibleHaysAlignmentBundle | null> {
  if (typeof fetcher !== 'function' || typeof scriptureContentVersion !== 'string' || !scriptureContentVersion.trim()
    || !Array.isArray(books) || books.length !== 66) return null;
  const expectedChapterKeys = new Set<string>();
  const seenBooks = new Set<string>();
  for (const book of books) {
    const code = String(book?.code ?? '').trim().toUpperCase();
    if (!OPENBIBLE_BOOK_TOKENS[code] || seenBooks.has(code) || !Number.isSafeInteger(book.chapters) || book.chapters < 1) return null;
    seenBooks.add(code);
    for (let chapter = 1; chapter <= book.chapters; chapter += 1) expectedChapterKeys.add(`${code}:${chapter}`);
  }
  if (expectedChapterKeys.size !== EXPECTED_BSB_CHAPTERS) return null;
  try {
    const response = await fetcher(HAYS_ALIGNMENT_PATH);
    if (!response.ok) return null;
    const manifest = await response.json() as Record<string, unknown>;
    const chapters = manifest.chapters as OpenBibleHaysChapterAlignment[] | undefined;
    const alignmentSource = typeof manifest.alignmentSource === 'string' ? manifest.alignmentSource : '';
    const alignmentRevision = typeof manifest.alignmentRevision === 'string' ? manifest.alignmentRevision.toLowerCase() : '';
    const inventorySha256 = typeof manifest.inventorySha256 === 'string' ? manifest.inventorySha256.toLowerCase() : '';
    const audioInventorySha256 = typeof manifest.audioInventorySha256 === 'string' ? manifest.audioInventorySha256.toLowerCase() : '';
    const audioContentVersion = typeof manifest.audioContentVersion === 'string' ? manifest.audioContentVersion.toLowerCase() : '';
    if (manifest.schemaVersion !== 1 || manifest.translationId !== 'bsb' || manifest.complete !== true
      || !SHA256_CONTENT_VERSION.test(audioContentVersion)
      || audioContentVersion !== `sha256-${audioInventorySha256}`
      || manifest.scriptureContentVersion !== scriptureContentVersion
      || !alignmentSource.trim() || !GIT_REVISION.test(alignmentRevision) || !SHA256.test(inventorySha256) || !SHA256.test(audioInventorySha256)
      || manifest.alignmentContentVersion !== `sha256-${inventorySha256}`
      || manifest.chapterCount !== EXPECTED_BSB_CHAPTERS
      || !Array.isArray(chapters) || chapters.length !== EXPECTED_BSB_CHAPTERS) return null;
    const seen = new Set<string>();
    let verseCount = 0;
    for (const row of chapters) {
      const book = String(row?.book ?? '').toUpperCase(), chapter = Number(row?.chapter), key = `${book}:${chapter}`;
      if (!expectedChapterKeys.has(key) || seen.has(key) || row?.translationId !== 'bsb' || row?.contentVersion !== audioContentVersion
        || row?.scriptureContentVersion !== scriptureContentVersion || row?.alignmentSource !== alignmentSource
        || row?.source !== 'Barry Hays BSB narration (OpenBible direct chapter stream)' || row?.license !== OPENBIBLE_LICENSE
        || !SHA256.test(String(row?.audioSha256 ?? '')) || !Number.isSafeInteger(row?.audioByteLength) || row.audioByteLength < 1) return null;
      const validation = validateChapterAlignment(row, { translationId: 'bsb', book, chapter });
      if (!validation.valid) return null;
      seen.add(key);
      expectedChapterKeys.delete(key);
      verseCount += row.verses.length;
    }
    if (seen.size !== EXPECTED_BSB_CHAPTERS || manifest.verseCount !== verseCount) return null;
    return Object.freeze({
      audioContentVersion,
      audioInventorySha256,
      scriptureContentVersion,
      alignmentSource,
      alignmentRevision,
      inventorySha256,
      chapters: Object.freeze([...chapters]),
    });
  } catch {
    return null;
  }
}

export async function loadOpenBibleNarratorStreamingManifest(
  narrator: OpenBibleBsbNarrator,
  books: readonly ReaderBookRef[],
  fetcher: typeof fetch = globalThis.fetch,
): Promise<ScriptureAudioManifest | null> {
  if (typeof fetcher !== 'function') return null;
  try {
    const response = await fetcher('/data/v6-scripture-manifests/bsb.json');
    if (!response.ok) return null;
    const scriptureManifest = await response.json() as { translationId?: unknown; contentVersion?: unknown };
    if (scriptureManifest.translationId !== 'bsb' || typeof scriptureManifest.contentVersion !== 'string') return null;
    return createOpenBibleNarratorStreamingManifest(narrator, scriptureManifest.contentVersion, books);
  } catch {
    return null;
  }
}

export function loadOpenBibleHaysStreamingManifest(
  books: readonly ReaderBookRef[],
  fetcher: typeof fetch = globalThis.fetch,
): Promise<ScriptureAudioManifest | null> {
  return loadOpenBibleNarratorStreamingManifest('hays', books, fetcher);
}

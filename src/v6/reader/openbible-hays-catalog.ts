import type { ReaderBookRef } from './contracts.ts';
import type { ScriptureAudioManifest } from './audio-policy.ts';

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

/** Build direct chapter URLs without inventing file sizes or checksums. This catalog
 * supports streaming only; offline installation still needs a separately reviewed,
 * checksum-pinned manifest and verified alignment. */
export function createOpenBibleNarratorStreamingManifest(
  narrator: OpenBibleBsbNarrator,
  scriptureContentVersion: string,
  books: readonly ReaderBookRef[],
): ScriptureAudioManifest {
  const source = NARRATORS[narrator];
  if (!source) throw new Error('OpenBible BSB audio narrator is unsupported.');
  if (typeof scriptureContentVersion !== 'string' || !scriptureContentVersion.trim()) {
    throw new Error('Current BSB Scripture content version is required for the OpenBible audio catalog.');
  }
  if (!Array.isArray(books) || books.length !== 66) throw new Error('OpenBible BSB audio requires the canonical 66-book inventory.');
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
    source: Object.freeze({
      translationId: 'bsb',
      source: `${source.name} BSB narration (OpenBible direct chapter stream)`,
      sourceUrl: `https://openbible.com/audio/${source.directory}/`,
      scriptureContentVersion,
      license: 'CC0 1.0 declared by the BSB Audio Bible project; exact files remain subject to review',
      rights: 'review-required',
      delivery: 'stream',
      textAlignment: 'unverified',
      attribution: `Narrated by ${source.name}; hosted by OpenBible.com`,
      rightsEvidence: 'https://audiobible.org/ and https://biblicalalignment.org/about',
      permissions: Object.freeze({ stream: 'allowed', offlineCopy: 'review-required' }),
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

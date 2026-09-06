const BOOK_ROWS = [
  ['Genesis','GEN',50],['Exodus','EXO',40],['Leviticus','LEV',27],['Numbers','NUM',36],['Deuteronomy','DEU',34],
  ['Joshua','JOS',24],['Judges','JDG',21],['Ruth','RUT',4],['1 Samuel','1SA',31],['2 Samuel','2SA',24],['1 Kings','1KI',22],['2 Kings','2KI',25],['1 Chronicles','1CH',29],['2 Chronicles','2CH',36],['Ezra','EZR',10],['Nehemiah','NEH',13],['Esther','EST',10],
  ['Job','JOB',42],['Psalms','PSA',150],['Proverbs','PRO',31],['Ecclesiastes','ECC',12],['Song of Songs','SNG',8],
  ['Isaiah','ISA',66],['Jeremiah','JER',52],['Lamentations','LAM',5],['Ezekiel','EZK',48],['Daniel','DAN',12],['Hosea','HOS',14],['Joel','JOL',3],['Amos','AMO',9],['Obadiah','OBA',1],['Jonah','JON',4],['Micah','MIC',7],['Nahum','NAM',3],['Habakkuk','HAB',3],['Zephaniah','ZEP',3],['Haggai','HAG',2],['Zechariah','ZEC',14],['Malachi','MAL',4],
  ['Matthew','MAT',28],['Mark','MRK',16],['Luke','LUK',24],['John','JHN',21],['Acts','ACT',28],['Romans','ROM',16],['1 Corinthians','1CO',16],['2 Corinthians','2CO',13],['Galatians','GAL',6],['Ephesians','EPH',6],['Philippians','PHP',4],['Colossians','COL',4],['1 Thessalonians','1TH',5],['2 Thessalonians','2TH',3],['1 Timothy','1TI',6],['2 Timothy','2TI',4],['Titus','TIT',3],['Philemon','PHM',1],['Hebrews','HEB',13],['James','JAS',5],['1 Peter','1PE',5],['2 Peter','2PE',3],['1 John','1JN',5],['2 John','2JN',1],['3 John','3JN',1],['Jude','JUD',1],['Revelation','REV',22]
];
export const BIBLE_BOOKS = Object.freeze(BOOK_ROWS.map(([name, code, chapters], index) => Object.freeze({ name, code, chapters, index })));

const TRANSLATIONS = Object.freeze({
  bsb: Object.freeze({ id: 'bsb', label: 'English · BSB', folder: 'bible', language: 'English', bundled: true, source: 'Berean Standard Bible', license: 'Public-domain / CC0 browser source', attribution: 'See data/packs/ATTRIBUTION.md' }),
  tl: Object.freeze({ id: 'tl', label: 'Tagalog · ULB', folder: 'tagalog', language: 'Tagalog', bundled: true, source: 'Tagalog Unlocked Literal Bible', license: 'CC BY-SA 4.0', attribution: '© 2018 Door43 World Missions Community' })
});

const BOOK_ALIASES = new Map();
const aliases = {
  GEN:['gen'],EXO:['ex','exo'],LEV:['lev'],NUM:['num'],DEU:['deut','deu'],JOS:['josh','jos'],JDG:['judg','jdg'],RUT:['ruth'],
  '1SA':['1sam','1sa'],'2SA':['2sam','2sa'],'1KI':['1kgs','1ki'],'2KI':['2kgs','2ki'],'1CH':['1chr','1ch'],'2CH':['2chr','2ch'],EZR:['ezra','ezr'],NEH:['neh'],EST:['est'],JOB:['job'],PSA:['ps','psalm','psalms','psa'],PRO:['prov','pro'],ECC:['eccl','ecc'],SNG:['song','sos','sng'],
  ISA:['isa'],JER:['jer'],LAM:['lam'],EZK:['ezek','ezk'],DAN:['dan'],HOS:['hos'],JOL:['joel','jol'],AMO:['amos','amo'],OBA:['obad','oba'],JON:['jonah','jon'],MIC:['mic'],NAM:['nah','nam'],HAB:['hab'],ZEP:['zeph','zep'],HAG:['hag'],ZEC:['zech','zec'],MAL:['mal'],
  MAT:['matt','mt','mat'],MRK:['mark','mk','mrk'],LUK:['luke','lk','luk'],JHN:['john','jn','jhn'],ACT:['acts','act'],ROM:['rom'],'1CO':['1cor','1co'],'2CO':['2cor','2co'],GAL:['gal'],EPH:['eph'],PHP:['phil','php'],COL:['col'],'1TH':['1thess','1th'],'2TH':['2thess','2th'],'1TI':['1tim','1ti'],'2TI':['2tim','2ti'],TIT:['titus','tit'],PHM:['philem','phm'],HEB:['heb'],JAS:['james','jas'],'1PE':['1pet','1pe'],'2PE':['2pet','2pe'],'1JN':['1john','1jn'],'2JN':['2john','2jn'],'3JN':['3john','3jn'],JUD:['jude','jud'],REV:['rev']
};
const normalizeBookToken = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
for (const book of BIBLE_BOOKS) {
  BOOK_ALIASES.set(normalizeBookToken(book.name), book);
  BOOK_ALIASES.set(normalizeBookToken(book.code), book);
  for (const alias of aliases[book.code] || []) BOOK_ALIASES.set(normalizeBookToken(alias), book);
}

const STEP_BOOK = Object.freeze({GEN:'Gen',EXO:'Exod',LEV:'Lev',NUM:'Num',DEU:'Deut',JOS:'Josh',JDG:'Judg',RUT:'Ruth','1SA':'1Sam','2SA':'2Sam','1KI':'1Kgs','2KI':'2Kgs','1CH':'1Chr','2CH':'2Chr',EZR:'Ezra',NEH:'Neh',EST:'Esth',JOB:'Job',PSA:'Ps',PRO:'Prov',ECC:'Eccl',SNG:'Song',ISA:'Isa',JER:'Jer',LAM:'Lam',EZK:'Ezek',DAN:'Dan',HOS:'Hos',JOL:'Joel',AMO:'Amos',OBA:'Obad',JON:'Jonah',MIC:'Mic',NAM:'Nah',HAB:'Hab',ZEP:'Zeph',HAG:'Hag',ZEC:'Zech',MAL:'Mal',MAT:'Matt',MRK:'Mark',LUK:'Luke',JHN:'John',ACT:'Acts',ROM:'Rom','1CO':'1Cor','2CO':'2Cor',GAL:'Gal',EPH:'Eph',PHP:'Phil',COL:'Col','1TH':'1Thess','2TH':'2Thess','1TI':'1Tim','2TI':'2Tim',TIT:'Titus',PHM:'Phlm',HEB:'Heb',JAS:'Jas','1PE':'1Pet','2PE':'2Pet','1JN':'1John','2JN':'2John','3JN':'3John',JUD:'Jude',REV:'Rev'});
const safeVerse = row => row && Number.isInteger(Number(row.c)) && Number(row.c) > 0 && Number.isInteger(Number(row.v)) && Number(row.v) > 0 && typeof row.t === 'string' && row.t.trim();
const freezeVerse = row => Object.freeze({ chapter: Number(row.c), verse: Number(row.v), text: String(row.t).trim() });
const referenceText = (book, chapter, verse = null) => `${book.name} ${chapter}${verse ? `:${verse}` : ''}`;

export function createBibleDataService({ fetcher = (...args) => fetch(...args) } = {}) {
  const cache = new Map();
  const getBook = code => { const book = BIBLE_BOOKS.find(item => item.code === String(code || '').toUpperCase()); if (!book) throw new Error(`Unknown Bible book: ${code || 'missing'}.`); return book; };
  const getTranslation = id => { const translation = TRANSLATIONS[String(id || '')]; if (!translation) throw new Error(`Unsupported translation: ${id || 'missing'}.`); return translation; };

  async function loadBook(translationId, code) {
    const translation = getTranslation(translationId);
    const book = getBook(code);
    const key = `${translation.id}:${book.code}`;
    if (cache.has(key)) return cache.get(key);
    const pending = (async () => {
      const response = await fetcher(`data/packs/${translation.folder}/${book.code}.json`);
      if (!response?.ok) throw new Error(`${translation.label} pack for ${book.name} is unavailable.`);
      const payload = await response.json();
      if (!Array.isArray(payload)) throw new Error(`${translation.label} pack for ${book.name} is malformed.`);
      const verses = payload.filter(safeVerse).map(freezeVerse).sort((a, b) => a.chapter - b.chapter || a.verse - b.verse);
      if (!verses.length) throw new Error(`${translation.label} pack for ${book.name} contains no readable verses.`);
      const seen = new Set();
      for (const verse of verses) {
        const verseKey = `${verse.chapter}:${verse.verse}`;
        if (seen.has(verseKey)) throw new Error(`${translation.label} pack for ${book.name} contains duplicate verse ${verseKey}.`);
        if (verse.chapter > book.chapters) throw new Error(`${translation.label} pack for ${book.name} contains invalid chapter ${verse.chapter}.`);
        seen.add(verseKey);
      }
      return Object.freeze({ book, translation, verses: Object.freeze(verses) });
    })();
    cache.set(key, pending);
    try { return await pending; } catch (error) { cache.delete(key); throw error; }
  }

  async function loadChapter(translationId, code, chapter) {
    const book = getBook(code);
    const chapterNumber = Number(chapter);
    if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > book.chapters) throw new Error(`Invalid chapter for ${book.name}.`);
    const loaded = await loadBook(translationId, code);
    const verses = loaded.verses.filter(verse => verse.chapter === chapterNumber);
    if (!verses.length) throw new Error(`No verses found for ${book.name} ${chapterNumber}.`);
    return Object.freeze({ book, translation: loaded.translation, chapter: chapterNumber, verses: Object.freeze(verses) });
  }

  function parseReference(input) {
    const query = String(input || '').trim();
    const match = query.match(/^(.+?)\s+(\d{1,3})(?::(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?)?$/);
    if (!match) return null;
    const book = BOOK_ALIASES.get(normalizeBookToken(match[1]));
    if (!book) return null;
    const chapter = Number(match[2]);
    const verseStart = match[3] ? Number(match[3]) : null;
    const verseEnd = match[4] ? Number(match[4]) : verseStart;
    if (chapter < 1 || chapter > book.chapters || (verseStart !== null && verseStart < 1) || (verseEnd !== null && verseEnd < verseStart)) return null;
    return Object.freeze({ book, chapter, verseStart, verseEnd });
  }

  async function search(translationId, query, { limit = 30 } = {}) {
    getTranslation(translationId);
    const text = String(query || '').trim();
    if (text.length < 3) throw new Error('Search needs at least 3 characters or a Bible reference such as John 3:16.');
    const parsed = parseReference(text);
    if (parsed) {
      const chapter = await loadChapter(translationId, parsed.book.code, parsed.chapter);
      const selected = parsed.verseStart === null ? chapter.verses : chapter.verses.filter(verse => verse.verse >= parsed.verseStart && verse.verse <= parsed.verseEnd);
      return Object.freeze({ query: text, type: 'reference', results: Object.freeze(selected.slice(0, limit).map(verse => Object.freeze({ book: parsed.book, chapter: parsed.chapter, verse: verse.verse, text: verse.text, reference: referenceText(parsed.book, parsed.chapter, verse.verse) }))), skippedBooks: Object.freeze([]) });
    }
    const needle = text.toLocaleLowerCase();
    const results = [];
    const skippedBooks = [];
    for (const book of BIBLE_BOOKS) {
      try {
        const loaded = await loadBook(translationId, book.code);
        for (const verse of loaded.verses) {
          if (!verse.text.toLocaleLowerCase().includes(needle)) continue;
          results.push(Object.freeze({ book, chapter: verse.chapter, verse: verse.verse, text: verse.text, reference: referenceText(book, verse.chapter, verse.verse) }));
          if (results.length >= limit) break;
        }
      } catch (error) { skippedBooks.push(Object.freeze({ code: book.code, message: error?.message || 'Pack unavailable.' })); }
      if (results.length >= limit) break;
    }
    return Object.freeze({ query: text, type: 'text', results: Object.freeze(results), skippedBooks: Object.freeze(skippedBooks) });
  }

  function externalLinks(code, chapter, verse = null) {
    const book = getBook(code);
    const chapterNumber = Number(chapter);
    if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > book.chapters) throw new Error(`Invalid chapter for ${book.name}.`);
    const ref = referenceText(book, chapterNumber, verse ? Number(verse) : null);
    const encodedRef = encodeURIComponent(ref);
    const esvPath = encodedRef.replace(/%20/g, '+');
    const stepRef = `${STEP_BOOK[book.code]}.${chapterNumber}${verse ? `.${Number(verse)}` : ''}`;
    return Object.freeze([
      Object.freeze({ id: 'esv', label: 'ESV', href: `https://www.esv.org/verses/${esvPath}/` }),
      Object.freeze({ id: 'niv', label: 'NIV', href: `https://www.biblegateway.com/passage/?search=${encodedRef}&version=NIV` }),
      Object.freeze({ id: 'amp', label: 'AMP', href: `https://www.biblegateway.com/passage/?search=${encodedRef}&version=AMP` }),
      Object.freeze({ id: 'step', label: 'STEP lexical/context', href: `https://www.stepbible.org/?q=${encodeURIComponent(`version=ESV@reference=${stepRef}`)}` })
    ]);
  }

  return Object.freeze({
    books: BIBLE_BOOKS,
    translations: Object.freeze(Object.values(TRANSLATIONS)),
    getBook,
    getTranslation,
    loadBook,
    loadChapter,
    parseReference,
    search,
    externalLinks,
    clearCache() { cache.clear(); },
    cacheSize() { return cache.size; }
  });
}

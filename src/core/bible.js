const BOOK_ROWS = [
  ['Genesis','GEN',50],['Exodus','EXO',40],['Leviticus','LEV',27],['Numbers','NUM',36],['Deuteronomy','DEU',34],
  ['Joshua','JOS',24],['Judges','JDG',21],['Ruth','RUT',4],['1 Samuel','1SA',31],['2 Samuel','2SA',24],['1 Kings','1KI',22],['2 Kings','2KI',25],['1 Chronicles','1CH',29],['2 Chronicles','2CH',36],['Ezra','EZR',10],['Nehemiah','NEH',13],['Esther','EST',10],
  ['Job','JOB',42],['Psalms','PSA',150],['Proverbs','PRO',31],['Ecclesiastes','ECC',12],['Song of Songs','SNG',8],
  ['Isaiah','ISA',66],['Jeremiah','JER',52],['Lamentations','LAM',5],['Ezekiel','EZK',48],['Daniel','DAN',12],['Hosea','HOS',14],['Joel','JOL',3],['Amos','AMO',9],['Obadiah','OBA',1],['Jonah','JON',4],['Micah','MIC',7],['Nahum','NAM',3],['Habakkuk','HAB',3],['Zephaniah','ZEP',3],['Haggai','HAG',2],['Zechariah','ZEC',14],['Malachi','MAL',4],
  ['Matthew','MAT',28],['Mark','MRK',16],['Luke','LUK',24],['John','JHN',21],['Acts','ACT',28],['Romans','ROM',16],['1 Corinthians','1CO',16],['2 Corinthians','2CO',13],['Galatians','GAL',6],['Ephesians','EPH',6],['Philippians','PHP',4],['Colossians','COL',4],['1 Thessalonians','1TH',5],['2 Thessalonians','2TH',3],['1 Timothy','1TI',6],['2 Timothy','2TI',4],['Titus','TIT',3],['Philemon','PHM',1],['Hebrews','HEB',13],['James','JAS',5],['1 Peter','1PE',5],['2 Peter','2PE',3],['1 John','1JN',5],['2 John','2JN',1],['3 John','3JN',1],['Jude','JUD',1],['Revelation','REV',22]
];
export const BIBLE_BOOKS = Object.freeze(BOOK_ROWS.map(([name, code, chapters], index) => Object.freeze({ name, code, chapters, index })));

const TRANSLATIONS = Object.freeze({
  bsb: Object.freeze({ id: 'bsb', label: 'English · BSB', folder: 'bible', language: 'English', bundled: true, mode: 'bundled', source: 'Berean Standard Bible', license: 'Public-domain / CC0 browser source', attribution: 'See data/packs/ATTRIBUTION.md' }),
  tl: Object.freeze({ id: 'tl', label: 'Tagalog · ULB', folder: 'tagalog', language: 'Tagalog', bundled: true, mode: 'bundled', source: 'Tagalog Unlocked Literal Bible', license: 'CC BY-SA 4.0', attribution: '© 2018 Door43 World Missions Community' }),
  jko: Object.freeze({ id: 'jko', label: '日本語 · 口語訳', language: 'Japanese', bundled: false, mode: 'live-kougo', source: '口語訳聖書 (1954/1955) · GetBible japkougo', license: '1955 edition copyright term expired; moral rights remain; later corrected wording may be protected', attribution: 'GetBible/CrossWire japkougo public-domain module · Scripture text displayed without modification' })
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

const STEP_BOOK = Object.freeze({GEN:'Gen',EXO:'Exod',LEV:'Lev',NUM:'Num',DEU:'Deut',JOS:'Josh',JDG:'Judg',RUT:'Ruth','1SA':'1Sam','2SA':'2Sam', '1KI':'1Kgs','2KI':'2Kgs','1CH':'1Chr','2CH':'2Chr',EZR:'Ezra',NEH:'Neh',EST:'Esth',JOB:'Job',PSA:'Ps',PRO:'Prov',ECC:'Eccl',SNG:'Song',ISA:'Isa',JER:'Jer',LAM:'Lam',EZK:'Ezek',DAN:'Dan',HOS:'Hos',JOL:'Joel',AMO:'Amos',OBA:'Obad',JON:'Jonah',MIC:'Mic',NAM:'Nah',HAB:'Hab',ZEP:'Zeph',HAG:'Hag',ZEC:'Zech',MAL:'Mal',MAT:'Matt',MRK:'Mark',LUK:'Luke',JHN:'John',ACT:'Acts',ROM:'Rom','1CO':'1Cor','2CO':'2Cor',GAL:'Gal',EPH:'Eph',PHP:'Phil',COL:'Col','1TH':'1Thess','2TH':'2Thess','1TI':'1Tim','2TI':'2Tim',TIT:'Titus',PHM:'Phlm',HEB:'Heb',JAS:'Jas','1PE':'1Pet','2PE':'2Pet','1JN':'1John','2JN':'2John','3JN':'3John',JUD:'Jude',REV:'Rev'});
const safeVerse = row => row && Number.isInteger(Number(row.c)) && Number(row.c) > 0 && Number.isInteger(Number(row.v)) && Number(row.v) > 0 && typeof row.t === 'string' && row.t.trim();
const freezeVerse = row => Object.freeze({ chapter: Number(row.c), verse: Number(row.v), text: String(row.t).trim() });
const referenceText = (book, chapter, verse = null) => `${book.name} ${chapter}${verse ? `:${verse}` : ''}`;
const plainString = value => typeof value === 'string' ? value.trim() : '';

export function createBibleDataService({ fetcher = (...args) => fetch(...args) } = {}) {
  const cache = new Map();
  const getBook = code => { const book = BIBLE_BOOKS.find(item => item.code === String(code || '').toUpperCase()); if (!book) throw new Error(`Unknown Bible book: ${code || 'missing'}.`); return book; };
  const getTranslation = id => { const translation = TRANSLATIONS[String(id || '')]; if (!translation) throw new Error(`Unsupported translation: ${id || 'missing'}.`); return translation; };

  async function fetchJson(path, unavailableMessage, malformedMessage) {
    if (cache.has(path)) return cache.get(path);
    const pending = (async () => {
      const response = await fetcher(path);
      if (!response?.ok) throw new Error(unavailableMessage);
      let payload;
      try { payload = await response.json(); } catch { throw new Error(malformedMessage); }
      return payload;
    })();
    cache.set(path, pending);
    try { return await pending; } catch (error) { cache.delete(path); throw error; }
  }

  async function loadBook(translationId, code) {
    const translation = getTranslation(translationId);
    const book = getBook(code);
    if (!translation.bundled) throw new Error(`${translation.label} is a live chapter source and does not expose bundled book packs.`);
    const key = `${translation.id}:${book.code}`;
    if (cache.has(key)) return cache.get(key);
    const pending = (async () => {
      const response = await fetcher(`data/packs/${translation.folder}/${book.code}.json`);
      if (!response?.ok) throw new Error(`${translation.label} pack for ${book.name} is unavailable.`);
      let payload;
      try { payload = await response.json(); } catch { throw new Error(`${translation.label} pack for ${book.name} is malformed.`); }
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

  async function loadKougoChapter(book, chapterNumber, translation) {
    const bookNumber = book.index + 1;
    const path = `https://api.getbible.net/v2/japkougo/${bookNumber}/${chapterNumber}.json`;
    const payload = await fetchJson(
      path,
      `口語訳 for ${book.name} ${chapterNumber} is unavailable. Check your internet connection and retry.`,
      `口語訳 for ${book.name} ${chapterNumber} returned malformed data.`
    );
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error(`口語訳 for ${book.name} ${chapterNumber} returned malformed data.`);
    const raw = Array.isArray(payload.verses) ? payload.verses : payload.verses && typeof payload.verses === 'object' ? Object.values(payload.verses) : [];
    const verses = raw.map((row, index) => ({
      chapter: chapterNumber,
      verse: Number(row?.verse ?? row?.v ?? row?.number ?? index + 1),
      text: String(row?.text ?? row?.t ?? row?.content ?? '').trim()
    })).filter(row => Number.isInteger(row.verse) && row.verse > 0 && row.text);
    if (!verses.length) throw new Error(`口語訳 for ${book.name} ${chapterNumber} contains no readable verses.`);
    verses.sort((a, b) => a.verse - b.verse);
    const seen = new Set();
    for (const verse of verses) {
      if (seen.has(verse.verse)) throw new Error(`口語訳 for ${book.name} ${chapterNumber} contains duplicate verse ${verse.verse}.`);
      seen.add(verse.verse);
      Object.freeze(verse);
    }
    return Object.freeze({ book, translation, chapter: chapterNumber, verses: Object.freeze(verses) });
  }

  async function loadChapter(translationId, code, chapter) {
    const translation = getTranslation(translationId);
    const book = getBook(code);
    const chapterNumber = Number(chapter);
    if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > book.chapters) throw new Error(`Invalid chapter for ${book.name}.`);
    if (translation.mode === 'live-kougo') return loadKougoChapter(book, chapterNumber, translation);
    const loaded = await loadBook(translation.id, code);
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
    const translation = getTranslation(translationId);
    const text = String(query || '').trim();
    if (text.length < 3) throw new Error('Search needs at least 3 characters or a Bible reference such as John 3:16.');
    const parsed = parseReference(text);
    if (parsed) {
      const chapter = await loadChapter(translation.id, parsed.book.code, parsed.chapter);
      const selected = parsed.verseStart === null ? chapter.verses : chapter.verses.filter(verse => verse.verse >= parsed.verseStart && verse.verse <= parsed.verseEnd);
      return Object.freeze({ query: text, type: 'reference', results: Object.freeze(selected.slice(0, limit).map(verse => Object.freeze({ book: parsed.book, chapter: parsed.chapter, verse: verse.verse, text: verse.text, reference: referenceText(parsed.book, parsed.chapter, verse.verse) }))), skippedBooks: Object.freeze([]) });
    }
    if (!translation.bundled) throw new Error(`${translation.label} text search is unavailable because this translation is loaded live one chapter at a time. Search by Bible reference instead.`);
    const needle = text.toLocaleLowerCase();
    const results = [];
    const skippedBooks = [];
    for (const book of BIBLE_BOOKS) {
      try {
        const loaded = await loadBook(translation.id, book.code);
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

  async function loadContextManifest() {
    const path = 'data/packs/context/manifest.json';
    const payload = await fetchJson(path, 'Original-language context manifest is unavailable.', 'Original-language context manifest is malformed.');
    if (!payload || !Array.isArray(payload.books)) throw new Error('Original-language context manifest is malformed.');
    return payload;
  }

  async function lexicalContext(code, chapter, verse) {
    const book = getBook(code);
    const chapterNumber = Number(chapter);
    const verseNumber = Number(verse);
    if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > book.chapters) throw new Error(`Invalid chapter for ${book.name}.`);
    if (!Number.isInteger(verseNumber) || verseNumber < 1) throw new Error('Invalid verse.');
    const scripture = await loadChapter('bsb', book.code, chapterNumber);
    const index = scripture.verses.findIndex(item => item.verse === verseNumber);
    if (index < 0) throw new Error(`${referenceText(book, chapterNumber, verseNumber)} is unavailable.`);

    let manifest;
    try { manifest = await loadContextManifest(); }
    catch (error) {
      if (/malformed/i.test(error?.message || '')) throw error;
      return Object.freeze({
        available: false, reason: error?.message || 'Original-language context is unavailable.',
        book, chapter: chapterNumber, verse: verseNumber, reference: referenceText(book, chapterNumber, verseNumber),
        scripture: scripture.verses[index], previous: scripture.verses[index - 1] || null, next: scripture.verses[index + 1] || null,
        entries: Object.freeze([]), coverage: null, source: 'STEPBible TBESH/TBESG', license: 'CC BY 4.0',
        note: 'Brief lexical fields only; not an interlinear or theological interpretation.',
        external: externalLinks(book.code, chapterNumber, verseNumber)
      });
    }
    const meta = manifest.books.find(item => item?.code === book.code);
    if (!meta?.path) {
      return Object.freeze({
        available: false, reason: `Original-language context pack for ${book.name} is unavailable.`,
        book, chapter: chapterNumber, verse: verseNumber, reference: referenceText(book, chapterNumber, verseNumber),
        scripture: scripture.verses[index], previous: scripture.verses[index - 1] || null, next: scripture.verses[index + 1] || null,
        entries: Object.freeze([]), coverage: null, source: plainString(manifest.source) || 'STEPBible TBESH/TBESG', license: plainString(manifest.license) || 'CC BY 4.0',
        note: plainString(manifest.note) || 'Brief lexical fields only; not an interlinear or theological interpretation.',
        external: externalLinks(book.code, chapterNumber, verseNumber)
      });
    }

    let pack;
    try {
      pack = await fetchJson(meta.path, `Original-language context pack for ${book.name} is unavailable.`, `Original-language context pack for ${book.name} is malformed.`);
    } catch (error) {
      if (/malformed/i.test(error?.message || '')) throw error;
      return Object.freeze({
        available: false, reason: error?.message || `Original-language context pack for ${book.name} is unavailable.`,
        book, chapter: chapterNumber, verse: verseNumber, reference: referenceText(book, chapterNumber, verseNumber),
        scripture: scripture.verses[index], previous: scripture.verses[index - 1] || null, next: scripture.verses[index + 1] || null,
        entries: Object.freeze([]), coverage: Object.freeze({ taggedVerses: Number(meta.tagged_verses) || 0, lexemes: Number(meta.lexemes) || 0 }),
        source: plainString(manifest.source) || 'STEPBible TBESH/TBESG', license: plainString(manifest.license) || 'CC BY 4.0',
        note: plainString(manifest.note) || 'Brief lexical fields only; not an interlinear or theological interpretation.',
        external: externalLinks(book.code, chapterNumber, verseNumber)
      });
    }
    if (!pack || typeof pack !== 'object' || Array.isArray(pack) || !pack.verses || typeof pack.verses !== 'object' || !pack.lexicon || typeof pack.lexicon !== 'object') {
      throw new Error(`Original-language context pack for ${book.name} is malformed.`);
    }

    const verseId = `${book.code}.${chapterNumber}.${verseNumber}`;
    const strongs = Array.isArray(pack.verses[verseId]) ? pack.verses[verseId].filter(value => typeof value === 'string' && value.trim()) : [];
    const entries = [];
    for (const strong of strongs) {
      const raw = pack.lexicon[strong];
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
      const usages = [];
      for (const [id, tags] of Object.entries(pack.verses)) {
        if (!Array.isArray(tags) || !tags.includes(strong)) continue;
        const match = String(id).match(/^([A-Z0-9]{3})\.(\d+)\.(\d+)$/);
        if (!match || match[1] !== book.code) continue;
        const useChapter = Number(match[2]), useVerse = Number(match[3]);
        usages.push(Object.freeze({ code: book.code, chapter: useChapter, verse: useVerse, reference: referenceText(book, useChapter, useVerse) }));
      }
      entries.push(Object.freeze({
        strong,
        language: plainString(raw.language) || (strong.startsWith('H') ? 'Hebrew' : strong.startsWith('G') ? 'Greek' : 'Original language'),
        lemma: plainString(raw.lemma),
        transliteration: plainString(raw.transliteration),
        morphology: plainString(raw.morphology),
        gloss: plainString(raw.gloss),
        usageTotal: usages.length,
        usages: Object.freeze(usages.slice(0, 8))
      }));
    }

    return Object.freeze({
      available: true, reason: '',
      book, chapter: chapterNumber, verse: verseNumber, reference: referenceText(book, chapterNumber, verseNumber),
      scripture: scripture.verses[index], previous: scripture.verses[index - 1] || null, next: scripture.verses[index + 1] || null,
      entries: Object.freeze(entries),
      coverage: Object.freeze({ taggedVerses: Number(meta.tagged_verses) || 0, lexemes: Number(meta.lexemes) || 0 }),
      source: plainString(pack.source) || plainString(manifest.source) || 'STEPBible TBESH/TBESG',
      license: plainString(pack.license) || plainString(manifest.license) || 'CC BY 4.0',
      note: plainString(manifest.note) || 'Brief lexical fields only; not an interlinear or theological interpretation.',
      external: externalLinks(book.code, chapterNumber, verseNumber)
    });
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
    lexicalContext,
    parseReference,
    search,
    externalLinks,
    clearCache() { cache.clear(); },
    cacheSize() { return cache.size; }
  });
}

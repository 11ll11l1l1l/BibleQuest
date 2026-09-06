const STORAGE_KEY = 'reader-state';
const DEFAULT_STATE = Object.freeze({ translation: 'bsb', book: 'JHN', chapter: 1, read: {} });

const localDate = date => {
  const value = date instanceof Date ? date : new Date(date);
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export function createReaderService({ bible, storage, clock = () => new Date() }) {
  if (!bible || !storage) throw new Error('Reader service requires Bible data and storage boundaries.');

  const normalize = input => {
    const translation = bible.translations.some(item => item.id === input?.translation) ? input.translation : DEFAULT_STATE.translation;
    let book;
    try { book = bible.getBook(input?.book || DEFAULT_STATE.book); }
    catch { book = bible.getBook(DEFAULT_STATE.book); }
    const rawChapter = Number(input?.chapter || 1);
    const chapter = Number.isInteger(rawChapter) ? Math.min(Math.max(rawChapter, 1), book.chapters) : 1;
    const read = input?.read && typeof input.read === 'object' && !Array.isArray(input.read) ? { ...input.read } : {};
    return { translation, book: book.code, chapter, read };
  };

  let state = normalize(storage.read(STORAGE_KEY, DEFAULT_STATE));
  const persist = () => { storage.write(STORAGE_KEY, state); return getState(); };
  const getState = () => Object.freeze({ ...state, read: Object.freeze({ ...state.read }) });

  function setTranslation(id) {
    bible.getTranslation(id);
    state = { ...state, translation: id };
    return persist();
  }

  function setBook(code, chapter = 1) {
    const book = bible.getBook(code);
    const next = Number(chapter);
    state = { ...state, book: book.code, chapter: Number.isInteger(next) ? Math.min(Math.max(next, 1), book.chapters) : 1 };
    return persist();
  }

  function setChapter(chapter) {
    const book = bible.getBook(state.book);
    const next = Number(chapter);
    if (!Number.isInteger(next) || next < 1 || next > book.chapters) throw new Error(`Invalid chapter for ${book.name}.`);
    state = { ...state, chapter: next };
    return persist();
  }

  function move(delta) {
    const direction = Number(delta);
    if (!Number.isInteger(direction) || Math.abs(direction) !== 1) throw new Error('Reader movement must be one chapter at a time.');
    let book = bible.getBook(state.book);
    let chapter = state.chapter + direction;
    if (chapter < 1) {
      if (book.index === 0) chapter = 1;
      else { book = bible.books[book.index - 1]; chapter = book.chapters; }
    } else if (chapter > book.chapters) {
      if (book.index === bible.books.length - 1) chapter = book.chapters;
      else { book = bible.books[book.index + 1]; chapter = 1; }
    }
    state = { ...state, book: book.code, chapter };
    return persist();
  }

  async function load() {
    return bible.loadChapter(state.translation, state.book, state.chapter);
  }

  function readKey(translation = state.translation, code = state.book, chapter = state.chapter) {
    return `${translation}:${code}:${chapter}`;
  }

  function markRead() {
    const key = readKey();
    if (!state.read[key]) state = { ...state, read: { ...state.read, [key]: localDate(clock()) } };
    return persist();
  }

  function isRead() {
    return Boolean(state.read[readKey()]);
  }

  async function search(query, options) {
    return bible.search(state.translation, query, options);
  }

  async function openSearchResult(result) {
    const book = bible.getBook(result?.book?.code || result?.book || '');
    const chapter = Number(result?.chapter);
    const verse = Number(result?.verse);
    if (!Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters || !Number.isInteger(verse) || verse < 1) throw new Error('Invalid search result.');
    state = { ...state, book: book.code, chapter };
    persist();
    const loaded = await load();
    if (!loaded.verses.some(item => item.verse === verse)) throw new Error('Search result verse is unavailable.');
    return Object.freeze({ chapter: loaded, verse });
  }

  async function peek(verse) {
    const number = Number(verse);
    if (!Number.isInteger(number) || number < 1) throw new Error('Invalid verse.');
    const loaded = await load();
    const found = loaded.verses.find(item => item.verse === number);
    if (!found) throw new Error('Verse is unavailable.');
    return Object.freeze({ ...found, reference: `${loaded.book.name} ${loaded.chapter}:${found.verse}`, links: bible.externalLinks(loaded.book.code, loaded.chapter, found.verse) });
  }

  return Object.freeze({
    getState,
    setTranslation,
    setBook,
    setChapter,
    move,
    load,
    markRead,
    isRead,
    search,
    openSearchResult,
    peek,
    externalLinks() { return bible.externalLinks(state.book, state.chapter); },
    books: bible.books,
    translations: bible.translations
  });
}

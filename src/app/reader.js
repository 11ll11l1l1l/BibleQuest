import { createOfflineScriptureAvailability } from './offline-scripture-status.js';
import { deriveVersePeek } from '../v6/reader/context-helpers.ts';
import { readerSearchResponseMatches } from '../v6/reader/scripture-repository.ts';
import { createReaderChapterReadBoundary } from '../v6/reader/live-progress.ts';

const STORAGE_KEY = 'reader-state';
const DEFAULT_STATE = Object.freeze({ translation: 'bsb', book: 'JHN', chapter: 1, read: {} });

export function createReaderService({ bible, storage, progress, bibleQuest = null }) {
  if (!bible || !storage || !progress) throw new Error('Reader service requires Bible data, storage and progress boundaries.');

  const offlineScripture = createOfflineScriptureAvailability({ bibleService: bible });
  const chapterProgress = createReaderChapterReadBoundary(progress);
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
    const request = Object.freeze({
      translation: state.translation,
      book: state.book,
      chapter: state.chapter,
    });
    const loaded = await bible.loadChapter(request.translation, request.book, request.chapter);
    if (
      state.translation !== request.translation
      || state.book !== request.book
      || state.chapter !== request.chapter
    ) throw new Error('Reader passage changed while Scripture was loading.');
    if (
      loaded?.translation?.id !== request.translation
      || loaded?.book?.code?.trim?.().toUpperCase() !== request.book.trim().toUpperCase()
      || loaded?.chapter !== request.chapter
    ) throw new Error('Scripture response does not match the requested Reader passage.');
    return loaded;
  }

  async function getOfflineStatus() {
    return offlineScripture.getStatus(state.translation, state.book);
  }

  function readKey(translation = state.translation, code = state.book, chapter = state.chapter) {
    return `${translation}:${code}:${chapter}`;
  }

  function chapterReadProgress(code=state.book,chapter=state.chapter) {
    return chapterProgress.find(code,chapter);
  }

  function markRead() {
    const translation = bible.getTranslation(state.translation);
    if (translation.mode === 'licensed-link') throw new Error(`${translation.label} opens externally; BibleQuest cannot mark unseen Scripture text as read.`);
    const key = readKey(),existing=chapterReadProgress();
    if (state.read[key] || existing) {
      if(!state.read[key]){
        const date=existing?.row?.date||'';
        const next={...state,read:{...state.read,[key]:date}};
        storage.write(STORAGE_KEY,next);state=next;
      }
      return Object.freeze({ newlyRead: false, progress: null, state: getState() });
    }
    const award = chapterProgress.record(state.book,state.chapter);
    const next = { ...state, read: { ...state.read, [key]: award.date } };
    storage.write(STORAGE_KEY, next);
    state = next;
    return Object.freeze({ newlyRead: true, progress: award, state: getState() });
  }

  function isRead() {
    const key=readKey();
    return Boolean(state.read[key]||chapterReadProgress());
  }

  async function search(query, options) {
    const translation = state.translation;
    const limit = options?.limit ?? 30;
    const result = await bible.search(translation, query, options);
    if (state.translation !== translation) {
      throw new Error('Reader translation changed while Scripture search was running.');
    }
    if (!readerSearchResponseMatches(String(query ?? ''), Number(limit), result)) {
      throw new Error('Scripture search response does not match the Reader request.');
    }
    return result;
  }

  async function openSearchResult(result) {
    const book = bible.getBook(result?.book?.code || result?.book || '');
    const chapter = Number(result?.chapter);
    const verse = Number(result?.verse);
    if (!Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters || !Number.isInteger(verse) || verse < 1) throw new Error('Invalid search result.');

    const requestState = Object.freeze({
      translation: state.translation,
      book: state.book,
      chapter: state.chapter,
    });
    const loaded = await bible.loadChapter(requestState.translation, book.code, chapter);
    if (
      state.translation !== requestState.translation
      || state.book !== requestState.book
      || state.chapter !== requestState.chapter
    ) throw new Error('Reader passage changed while opening the search result.');
    if (loaded?.translation?.id !== requestState.translation) throw new Error('Search result content does not match the selected translation.');
    const projection = deriveVersePeek({
      translationId: requestState.translation,
      book: loaded.book,
      chapter: loaded.chapter,
      verses: loaded.verses,
    }, verse);
    if (
      !projection
      || projection.bookCode.trim().toUpperCase() !== book.code.trim().toUpperCase()
      || projection.chapter !== chapter
    ) throw new Error('Search result verse is unavailable.');

    state = { ...state, book: book.code, chapter };
    persist();
    return Object.freeze({ chapter: loaded, verse });
  }

  async function peek(verse) {
    const number = Number(verse);
    if (!Number.isInteger(number) || number < 1) throw new Error('Invalid verse.');
    const loaded = await load();
    if (loaded?.translation?.id !== state.translation) throw new Error('Verse content does not match the selected translation.');
    const projection = deriveVersePeek({
      translationId: state.translation,
      book: loaded.book,
      chapter: loaded.chapter,
      verses: loaded.verses,
    }, number);
    if (!projection) throw new Error('Verse is unavailable.');
    return Object.freeze({
      ...projection.scripture,
      reference: projection.reference,
      links: bible.externalLinks(projection.bookCode, projection.chapter, number),
    });
  }

  async function contextChapter(code = state.book, chapter = state.chapter) {
    return bible.loadChapter('bsb', code, chapter);
  }

  async function lexicalContext({ code = state.book, chapter = state.chapter, verse = 1 } = {}) {
    return bible.lexicalContext(code, chapter, verse);
  }

  return Object.freeze({
    getState,
    setTranslation,
    setBook,
    setChapter,
    move,
    load,
    getOfflineStatus,
    markRead,
    isRead,
    search,
    openSearchResult,
    peek,
    contextChapter,
    lexicalContext,
    externalLinks() { return bible.externalLinks(state.book, state.chapter); },
    referenceLinks(code, chapter, verse = null) { return bible.externalLinks(code, chapter, verse); },
    questSnapshot() { return bibleQuest?.snapshot?.() || null; },
    activateQuestNext() { return bibleQuest?.activateNext?.() || null; },
    completeQuestChapter(source = 'reader') {
      if (!bibleQuest?.completeActive) throw new Error('Main Bible Quest is unavailable.');
      return bibleQuest.completeActive({ code:state.book, chapter:state.chapter, translation:state.translation, source });
    },
    books: bible.books,
    translations: bible.translations
  });
}

import { createBibleDataService } from '../src/core/bible.js';
import { createReaderService } from '../src/app/reader.js';
import { createProgressService } from '../src/core/progress.js';

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const fetchCalls = [];
const bible = createBibleDataService({ fetcher: async path => { fetchCalls.push(path); return { ok: false, async json() { return null; } }; } });

const nlt = bible.getTranslation('nlt');
assert(nlt.mode === 'licensed-link' && nlt.externalVersion === 'NLT' && nlt.bundled === false, 'NLT must be represented as a licensed external-reader translation.');

const chapter = await bible.loadChapter('nlt', 'JHN', 3);
assert(chapter.book.code === 'JHN' && chapter.chapter === 3, 'NLT passage metadata did not preserve the selected book/chapter.');
assert(chapter.verses.length === 0, 'NLT licensed mode must not expose redistributed verse text.');
assert(fetchCalls.length === 0, 'Selecting an NLT passage must not fetch a hidden Scripture endpoint.');
const chapterUrl = new URL(chapter.external.href);
assert(chapterUrl.hostname === 'www.biblegateway.com' && chapterUrl.searchParams.get('search') === 'John 3' && chapterUrl.searchParams.get('version') === 'NLT', 'NLT chapter handoff URL is malformed.');

const numbered = bible.licensedPassage('nlt', '1JN', 3, 1);
const numberedUrl = new URL(numbered.href);
assert(numbered.reference === '1 John 3:1' && numberedUrl.searchParams.get('search') === '1 John 3:1' && numberedUrl.searchParams.get('version') === 'NLT', 'NLT numbered-book/verse handoff is malformed.');

let packError = '';
try { await bible.loadBook('nlt', 'JHN'); } catch (error) { packError = error.message; }
assert(/external licensed-reader mode/i.test(packError), 'NLT must reject bundled-pack access clearly.');
let searchError = '';
try { await bible.search('nlt', 'John 3:16'); } catch (error) { searchError = error.message; }
assert(/licensed external reader/i.test(searchError), 'NLT in-app search must redirect conceptually to the licensed reader rather than returning text.');
assert(fetchCalls.length === 0, 'NLT pack/search rejection must not trigger network fetches.');

const nltLink = bible.externalLinks('JHN', 3, 16).find(item => item.id === 'nlt');
assert(nltLink && new URL(nltLink.href).searchParams.get('search') === 'John 3:16', 'General Reader external links must expose exact NLT verse handoff.');

const memory = new Map();
const storage = {
  read(key, fallback = null) { return memory.has(key) ? structuredClone(memory.get(key)) : structuredClone(fallback); },
  write(key, value) { memory.set(key, structuredClone(value)); return value; }
};
const store = { state: {}, setState(patch) { this.state = typeof patch === 'function' ? patch(this.state) : { ...this.state, ...patch }; return this.state; } };
const progress = createProgressService({ storage, store, clock: () => new Date('2026-09-07T12:00:00+09:00'), timeZone: 'Asia/Tokyo' });
const reader = createReaderService({ bible, storage, progress });
reader.setBook('JHN', 3);
reader.setTranslation('nlt');
const readerChapter = await reader.load();
assert(readerChapter.translation.mode === 'licensed-link' && readerChapter.verses.length === 0, 'Reader must preserve NLT licensed mode without text.');
reader.move(1);
assert(reader.getState().book === 'JHN' && reader.getState().chapter === 4, 'NLT mode must retain normal chapter navigation.');
reader.move(-1);
assert(reader.getState().chapter === 3, 'NLT previous navigation failed.');

let readError = '';
try { reader.markRead(); } catch (error) { readError = error.message; }
assert(/cannot mark unseen Scripture text as read/i.test(readError), 'NLT external mode must block Reader read-credit.');
assert(progress.getState().xp === 0 && progress.getState().counters.chaptersRead === 0, 'NLT external mode must not invent XP or chapter-read progress.');

const reloadedProgress = createProgressService({ storage, store: { state: {}, setState(patch) { this.state = typeof patch === 'function' ? patch(this.state) : { ...this.state, ...patch }; return this.state; } }, clock: () => new Date('2026-09-07T12:00:00+09:00'), timeZone: 'Asia/Tokyo' });
const reloaded = createReaderService({ bible, storage, progress: reloadedProgress });
assert(reloaded.getState().translation === 'nlt' && reloaded.getState().book === 'JHN' && reloaded.getState().chapter === 3, 'NLT translation/book/chapter selection must persist through the Reader storage boundary.');
assert(fetchCalls.length === 0, 'NLT Reader state/reload must still require no hidden Scripture fetch.');

console.log('BibleQuest v3 NLT licensed-link edge regression passed.');

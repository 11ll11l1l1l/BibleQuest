import { createBibleDataService } from '../src/core/bible.js';
import { createReaderService } from '../src/app/reader.js';
import { createProgressService } from '../src/core/progress.js';

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const JHN3 = 'https://api.getbible.net/v2/japkougo/43/3.json';
const GEN1 = 'https://api.getbible.net/v2/japkougo/1/1.json';
const EXO1 = 'https://api.getbible.net/v2/japkougo/2/1.json';
const fetchCounts = new Map();
let exodusFailures = 1;
const fetcher = async path => {
  fetchCounts.set(path, (fetchCounts.get(path) || 0) + 1);
  if (path === JHN3) return { ok: true, async json() { return { book_name: 'ヨハネによる福音書', verses: [
    { verse: 17, text: '神が御子を世につかわされたのは、世をさばくためではなく、御子によって、この世が救われるためである。' },
    { verse: 16, text: '  神はそのひとり子を賜わったほどに、この世を愛して下さった。  ' }
  ] }; } };
  if (path === GEN1) return { ok: true, async json() { return { verses: { one: { verse: 1, text: 'はじめに神は天と地とを創造された。' } } }; } };
  if (path === EXO1 && exodusFailures-- > 0) return { ok: false, status: 503, async json() { return {}; } };
  if (path === EXO1) return { ok: true, async json() { return { verses: [{ verse: 1, text: 'さて、ヤコブと共に、おのおのその家族を伴って、エジプトへ行ったイスラエルの子らの名は次のとおりである。' }] }; } };
  return { ok: false, status: 404, async json() { return null; } };
};

const bible = createBibleDataService({ fetcher });
const japanese = bible.getTranslation('jko');
assert(japanese.mode === 'live-kougo' && japanese.bundled === false && japanese.language === 'Japanese', 'Japanese Kougo must be declared as a live, non-bundled translation.');
assert(/GetBible japkougo/.test(japanese.source) && /moral rights/i.test(japanese.license) && /without modification/i.test(japanese.attribution), 'Japanese Kougo source/license/unchanged-text attribution is incomplete.');

const john = await bible.loadChapter('jko', 'JHN', 3);
assert(fetchCounts.get(JHN3) === 1, 'Japanese Kougo must use the recovered GetBible chapter URL and canonical John book number 43.');
assert(john.translation.id === 'jko' && john.verses.length === 2 && john.verses[0].verse === 16 && john.verses[1].verse === 17, 'Japanese live chapter must normalize and sort returned verses.');
assert(john.verses[0].text === '神はそのひとり子を賜わったほどに、この世を愛して下さった。', 'Japanese Scripture text must be preserved except surrounding transport whitespace.');
await bible.loadChapter('jko', 'JHN', 3);
assert(fetchCounts.get(JHN3) === 1, 'Successful Japanese live chapter must be cached by its source URL.');

const genesis = await bible.loadChapter('jko', 'GEN', 1);
assert(fetchCounts.get(GEN1) === 1 && genesis.verses[0].text === 'はじめに神は天と地とを創造された。', 'Genesis must map to GetBible book number 1 and accept object-shaped verse payloads.');

let bulkError = '';
try { await bible.loadBook('jko', 'JHN'); } catch (error) { bulkError = error.message; }
assert(/live chapter source/i.test(bulkError), 'Japanese Kougo must not masquerade as a bundled whole-book pack.');
let textSearchError = '';
try { await bible.search('jko', 'ひとり子'); } catch (error) { textSearchError = error.message; }
assert(/loaded live one chapter at a time/i.test(textSearchError), 'Japanese text search must fail clearly instead of bulk-fetching all 66 books.');
const reference = await bible.search('jko', 'John 3:16');
assert(reference.type === 'reference' && reference.results[0]?.text === john.verses[0].text, 'Reference search should remain available for the live Japanese source.');

let unavailable = '';
try { await bible.loadChapter('jko', 'EXO', 1); } catch (error) { unavailable = error.message; }
assert(/unavailable/i.test(unavailable) && /retry/i.test(unavailable), 'Japanese network/source failure must be explicit and retryable.');
const exodus = await bible.loadChapter('jko', 'EXO', 1);
assert(fetchCounts.get(EXO1) === 2 && exodus.verses.length === 1, 'Failed Japanese live fetch must not poison the cache; a later retry must fetch again.');

const malformedBible = createBibleDataService({ fetcher: async path => path === JHN3 ? { ok: true, async json() { return { verses: [] }; } } : { ok: false, async json() { return null; } } });
let malformed = '';
try { await malformedBible.loadChapter('jko', 'JHN', 3); } catch (error) { malformed = error.message; }
assert(/no readable verses|malformed/i.test(malformed), 'Malformed/empty Japanese source data must fail without inventing Scripture.');

let semanticCalls = 0;
const semanticRetryBible = createBibleDataService({ fetcher: async path => {
  if (path !== JHN3) return { ok: false, async json() { return null; } };
  semanticCalls++;
  return { ok: true, async json() { return semanticCalls === 1 ? { verses: [] } : { verses: [{ verse: 16, text: '回復後の口語訳本文' }] }; } };
} });
let semanticError = '';
try { await semanticRetryBible.loadChapter('jko', 'JHN', 3); } catch (error) { semanticError = error.message; }
assert(/no readable verses/i.test(semanticError), 'Semantically invalid HTTP-200 Japanese payload must fail clearly.');
const semanticRecovered = await semanticRetryBible.loadChapter('jko', 'JHN', 3);
assert(semanticCalls === 2 && semanticRecovered.verses[0]?.text === '回復後の口語訳本文', 'Invalid HTTP-200 Japanese payload must be evicted so Retry performs a new source request.');

const memory = new Map();
const storage = { read(key, fallback = null) { return memory.has(key) ? structuredClone(memory.get(key)) : structuredClone(fallback); }, write(key, value) { memory.set(key, structuredClone(value)); return value; } };
const store = { state: {}, setState(patch) { this.state = typeof patch === 'function' ? patch(this.state) : { ...this.state, ...patch }; return this.state; } };
const progress = createProgressService({ storage, store, clock: () => new Date('2026-09-07T20:00:00+09:00'), timeZone: 'Asia/Tokyo' });
const reader = createReaderService({ bible, storage, progress });
reader.setBook('JHN', 3);
reader.setTranslation('jko');
assert((await reader.load()).verses[0].text === john.verses[0].text, 'Reader must load Japanese through the existing Bible service.');
const reloaded = createReaderService({ bible, storage, progress });
assert(reloaded.getState().translation === 'jko' && reloaded.getState().book === 'JHN' && reloaded.getState().chapter === 3, 'Japanese translation selection and passage must persist through the Reader storage boundary.');
assert(progress.getState().xp === 0, 'Selecting/loading Japanese Scripture must not invent XP.');

console.log('BibleQuest v3 Japanese Kougo live-source edge regression passed.');

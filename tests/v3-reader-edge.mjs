import { createBibleDataService } from '../src/core/bible.js';
import { createReaderService } from '../src/app/reader.js';

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const payloads = new Map([
  ['data/packs/bible/GEN.json', [{ c: 2, v: 1, t: 'Thus the heavens and the earth were completed.' }, { c: 1, v: 2, t: 'Now the earth was formless and void.' }, { c: 1, v: 1, t: 'In the beginning God created the heavens and the earth.' }]],
  ['data/packs/tagalog/GEN.json', [{ c: 1, v: 1, t: 'Noong simula nilikha ng Diyos ang langit at ang lupa.' }]],
  ['data/packs/bible/JHN.json', [{ c: 3, v: 16, t: 'For God so loved the world.' }, { c: 3, v: 17, t: 'For God did not send His Son into the world to condemn the world.' }]],
  ['data/packs/bible/EXO.json', [{ c: 1, v: 1, t: 'These are the names of the sons of Israel.' }]]
]);
const fetchCounts = new Map();
const fetcher = async path => {
  fetchCounts.set(path, (fetchCounts.get(path) || 0) + 1);
  const data = payloads.get(path);
  if (!data) return { ok: false, async json() { return null; } };
  return { ok: true, async json() { return structuredClone(data); } };
};
const bible = createBibleDataService({ fetcher });

const gen1 = await bible.loadChapter('bsb', 'GEN', 1);
assert(gen1.verses.length === 2 && gen1.verses[0].verse === 1 && gen1.verses[1].verse === 2, 'Bible service must normalize unsorted book packs by chapter/verse.');
await bible.loadChapter('bsb', 'GEN', 1);
assert(fetchCounts.get('data/packs/bible/GEN.json') === 1, 'Bible service must cache a book pack after first load.');
const tagalog = await bible.loadChapter('tl', 'GEN', 1);
assert(tagalog.verses[0].text.startsWith('Noong simula'), 'Tagalog translation must use the Tagalog pack contract.');
assert(fetchCounts.get('data/packs/tagalog/GEN.json') === 1, 'Tagalog must use its own translation cache key.');

const parsed = bible.parseReference('John 3:16');
assert(parsed?.book.code === 'JHN' && parsed.chapter === 3 && parsed.verseStart === 16, 'Reference parser failed John 3:16.');
const parsedNumbered = bible.parseReference('1 John 3:1');
assert(parsedNumbered?.book.code === '1JN', 'Reference parser failed a numbered book.');
const referenceSearch = await bible.search('bsb', 'John 3:16');
assert(referenceSearch.type === 'reference' && referenceSearch.results[0]?.reference === 'John 3:16', 'Reference search did not produce navigable result.');
const textSearch = await bible.search('bsb', 'beginning', { limit: 1 });
assert(textSearch.type === 'text' && textSearch.results[0]?.reference === 'Genesis 1:1', 'Text search failed to find bundled verse text.');
let shortSearchError = '';
try { await bible.search('bsb', 'ab'); } catch (error) { shortSearchError = error.message; }
assert(/at least 3/i.test(shortSearchError), 'Short/invalid search must fail clearly.');
let missingPackError = '';
try { await bible.loadChapter('bsb', 'PSA', 1); } catch (error) { missingPackError = error.message; }
assert(/unavailable/i.test(missingPackError), 'Missing pack must produce a controlled data-service error.');

const links = bible.externalLinks('JHN', 3, 16);
assert(links.length === 4, 'Reader external link contract is incomplete.');
assert(links.find(item => item.id === 'esv')?.href.includes('esv.org/verses/John+3%3A16'), 'ESV link is malformed.');
assert(links.find(item => item.id === 'niv')?.href.includes('version=NIV'), 'NIV link is malformed.');
assert(links.find(item => item.id === 'amp')?.href.includes('version=AMP'), 'AMP link is malformed.');
assert(decodeURIComponent(links.find(item => item.id === 'step')?.href || '').includes('reference=John.3.16'), 'STEP link is malformed.');
const numberedStep = decodeURIComponent(bible.externalLinks('1JN', 3, 1).find(item => item.id === 'step')?.href || '');
assert(numberedStep.includes('reference=1John.3.1'), 'STEP numbered-book reference encoding is malformed.');

const memory = new Map();
const storage = { read(key, fallback = null) { return memory.has(key) ? structuredClone(memory.get(key)) : fallback; }, write(key, value) { memory.set(key, structuredClone(value)); return value; } };
const reader = createReaderService({ bible, storage, clock: () => new Date('2026-09-06T12:00:00+09:00') });
reader.setBook('GEN', 50);
reader.move(1);
assert(reader.getState().book === 'EXO' && reader.getState().chapter === 1, 'Next chapter must cross from Genesis 50 to Exodus 1.');
reader.move(-1);
assert(reader.getState().book === 'GEN' && reader.getState().chapter === 50, 'Previous chapter must cross back to Genesis 50.');
reader.setBook('GEN', 1);
reader.setTranslation('tl');
reader.markRead();
assert(reader.isRead(), 'Reader read marking failed.');
const reloaded = createReaderService({ bible, storage, clock: () => new Date('2026-09-06T12:00:00+09:00') });
assert(reloaded.getState().translation === 'tl' && reloaded.getState().book === 'GEN' && reloaded.getState().chapter === 1 && reloaded.isRead(), 'Reader state/read mark did not persist through storage boundary.');

console.log('BibleQuest v3 Bible-data/reader edge regression passed.');

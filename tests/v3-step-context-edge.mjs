import { createBibleDataService } from '../src/core/bible.js';
import { createReaderService } from '../src/app/reader.js';
import { createProgressService } from '../src/core/progress.js';

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const payloads = new Map([
  ['data/packs/bible/JHN.json', [
    { c: 3, v: 15, t: 'that everyone who believes in Him may have eternal life.' },
    { c: 3, v: 16, t: 'For God so loved the world that He gave His one and only Son.' },
    { c: 3, v: 17, t: 'For God did not send His Son into the world to condemn the world.' },
    { c: 4, v: 8, t: 'The woman left her water jar and went back into the town.' }
  ]],
  ['data/packs/bible/EXO.json', [{ c: 1, v: 1, t: 'These are the names of the sons of Israel.' }]],
  ['data/packs/context/manifest.json', {
    version: 1,
    books: [
      { code: 'JHN', tagged_verses: 3, lexemes: 3, path: 'data/packs/context/JHN.json' },
      { code: 'EXO', tagged_verses: 1, lexemes: 1, path: 'data/packs/context/EXO.json' }
    ],
    source: 'STEPBible TBESH/TBESG',
    license: 'CC BY 4.0',
    note: 'Brief lexical fields only; not an interlinear or theological interpretation.'
  }],
  ['data/packs/context/JHN.json', {
    code: 'JHN',
    source: 'BSB Strong tags + STEPBible TBESH/TBESG',
    license: 'BSB tags CC0; STEPBible lexical fields CC BY 4.0',
    verses: {
      'JHN.3.16': ['G25', 'G2889'],
      'JHN.3.17': ['G2889'],
      'JHN.4.8': ['G25']
    },
    lexicon: {
      G25: { language: 'Greek', strong: 'G25', lemma: 'ἀγαπάω', transliteration: 'agapaō', morphology: 'V-AAI-3S', gloss: 'to love' },
      G2889: { language: 'Greek', strong: 'G2889', lemma: 'κόσμος', transliteration: 'kosmos', morphology: 'N-AMS', gloss: 'world' }
    }
  }]
]);
const counts = new Map();
const fetcher = async path => {
  counts.set(path, (counts.get(path) || 0) + 1);
  if (!payloads.has(path)) return { ok: false, async json() { return null; } };
  return { ok: true, async json() { return structuredClone(payloads.get(path)); } };
};

const bible = createBibleDataService({ fetcher });
const context = await bible.lexicalContext('JHN', 3, 16);
assert(context.available, 'John 3:16 lexical context must be available.');
assert(context.reference === 'John 3:16' && context.scripture.text.includes('God so loved'), 'Context must retain the BSB verse and reference.');
assert(context.previous?.verse === 15 && context.next?.verse === 17, 'Context must expose surrounding verses from the BSB chapter.');
assert(context.entries.length === 2, 'John 3:16 must expose both mocked Greek lexical entries.');
const love = context.entries.find(item => item.strong === 'G25');
assert(love?.language === 'Greek' && love.lemma === 'ἀγαπάω' && love.transliteration === 'agapaō' && love.morphology === 'V-AAI-3S' && love.gloss === 'to love', 'Lexical fields must retain STEPBible language/lemma/transliteration/morphology/gloss.');
assert(love.usageTotal === 2 && love.usages.some(item => item.reference === 'John 4:8'), 'In-book usage must be calculated from the same context pack.');
assert(context.coverage.taggedVerses === 3 && context.coverage.lexemes === 3, 'Context manifest coverage must be exposed.');
assert(/STEPBible/.test(context.source) && /CC BY 4\.0/.test(context.license), 'Context source/license attribution must remain visible.');
assert(context.note.includes('not an interlinear'), 'Context limitations must remain explicit.');
assert(Object.isFrozen(context) && Object.isFrozen(context.entries) && Object.isFrozen(context.entries[0].usages), 'Published lexical snapshots must be immutable.');
assert(decodeURIComponent(context.external.find(item => item.id === 'step')?.href || '').includes('reference=John.3.16'), 'Context must retain the verse-specific external STEP handoff.');

await bible.lexicalContext('JHN', 3, 16);
assert(counts.get('data/packs/context/manifest.json') === 1 && counts.get('data/packs/context/JHN.json') === 1, 'Context manifest/book packs must cache behind the Bible data service.');

const untagged = await bible.lexicalContext('JHN', 3, 15);
assert(untagged.available && untagged.entries.length === 0, 'A readable verse with no Strong tags must be a valid empty context result.');

const unavailable = await bible.lexicalContext('EXO', 1, 1);
assert(!unavailable.available && /unavailable/i.test(unavailable.reason) && unavailable.entries.length === 0, 'Missing context packs must produce a controlled unavailable result rather than breaking Reader.');

let malformedError = '';
const malformedBible = createBibleDataService({ fetcher: async path => {
  if (path === 'data/packs/bible/JHN.json') return { ok: true, async json() { return structuredClone(payloads.get(path)); } };
  if (path === 'data/packs/context/manifest.json') return { ok: true, async json() { return { books: [{ code: 'JHN', path: 'data/packs/context/JHN.json' }] }; } };
  if (path === 'data/packs/context/JHN.json') return { ok: true, async json() { return []; } };
  return { ok: false, async json() { return null; } };
} });
try { await malformedBible.lexicalContext('JHN', 3, 16); } catch (error) { malformedError = error.message; }
assert(/malformed/i.test(malformedError), 'Malformed context data must fail with a controlled data-service error.');

const memory = new Map();
const storage = {
  read(key, fallback = null) { return memory.has(key) ? structuredClone(memory.get(key)) : structuredClone(fallback); },
  write(key, value) { memory.set(key, structuredClone(value)); return value; }
};
const store = { state: {}, setState(patch) { this.state = typeof patch === 'function' ? patch(this.state) : { ...this.state, ...patch }; return this.state; } };
const progress = createProgressService({ storage, store, clock: () => new Date('2026-09-07T12:00:00+09:00'), timeZone: 'Asia/Tokyo' });
const reader = createReaderService({ bible, storage, progress });
reader.setBook('JHN', 3);
const before = progress.getState();
const readerContext = await reader.lexicalContext({ verse: 16 });
const contextChapter = await reader.contextChapter('JHN', 3);
assert(readerContext.reference === 'John 3:16' && contextChapter.verses.length === 3, 'Reader must delegate context and BSB context-chapter reads through the Bible owner.');
assert(reader.getState().book === 'JHN' && reader.getState().chapter === 3, 'Lexical lookup must not mutate the main Reader passage.');
assert(progress.getState().xp === before.xp && progress.getState().totalActivities === before.totalActivities, 'Lexical study must not invent XP or activity rewards.');

console.log('BibleQuest v3 STEPBible lexical/context edge regression passed.');

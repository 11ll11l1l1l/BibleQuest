import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { BIBLE_BOOKS, createBibleDataService } from '../../src/core/bible.js';
import { createStore } from '../../src/app/store.js';
import { createReaderService } from '../../src/app/reader.js';
import { createProgressService } from '../../src/core/progress.js';
import { parseIlocanoVpl } from '../../scripts/import-ilocano-vpl.mjs';
import { SCRIPTURE_PACKAGE_SOURCES, buildScripturePackageManifest } from '../../scripts/v6-generate-scripture-manifests.mjs';
import { fullTranslationOfflineEligibility } from '../../src/v6/reader/full-translation-offline.ts';
import { scripturePackageIdentityForPath } from '../../src/v6/reader/package-storage.ts';
const source = JSON.parse(readFileSync('data/packs/ilocano/SOURCE.json', 'utf8'));
const fetcher = async path => { try { const bytes = readFileSync(path); return { ok: true, json: async () => JSON.parse(bytes) }; } catch { return { ok: false }; } };
function memory() { const values = new Map(); return { read: (key, fallback) => values.get(key) ?? fallback, write: (key, value) => values.set(key, value) }; }
test('Ilocano corpus hashes and all canonical chapters match recorded source coverage', () => {
  let records = 0, chapters = 0;
  assert.equal(source.books.length, 66);
  for (const book of BIBLE_BOOKS) {
    const bytes = readFileSync(`data/packs/ilocano/${book.code}.json`), rows = JSON.parse(bytes), meta = source.books.find(row => row.code === book.code);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), meta.sha256);
    assert.equal(bytes.length, meta.bytes);
    assert.equal(rows.length, meta.records);
    const seen = new Set();
    for (const row of rows) { assert.ok(row.c >= 1 && row.c <= book.chapters && row.v > 0 && row.t.trim()); const key = `${row.c}:${row.v}`; assert.equal(seen.has(key), false); seen.add(key); }
    assert.equal(new Set(rows.map(row => row.c)).size, book.chapters);
    records += rows.length; chapters += book.chapters;
  }
  assert.equal(records, 31090); assert.equal(chapters, 1189); assert.equal(source.emptySourceVerses.length, 12);
  assert.equal(createHash('sha256').update(readFileSync('data/packs/ilocano/LICENSE.html')).digest('hex'), source.licenseSha256);
});
test('Ilocano source parser maps publisher codes, records empty addresses and rejects corruption', () => {
  const parsed = parseIlocanoVpl('JOH 3:16 source text\nMAR 9:44 \n');
  assert.equal(parsed.books.get('JHN')[0].t, 'source text');
  assert.deepEqual(parsed.empty, ['MRK 9:44']);
  assert.throws(() => parseIlocanoVpl('JOH 3:16 first\nJHN 3:16 duplicate\n'), /Duplicate/);
  assert.throws(() => parseIlocanoVpl('GEN 51:1 invalid\n'), /Invalid/);
  assert.throws(() => parseIlocanoVpl('not a source record\n'), /Malformed/);
});
test('actual Reader selects, reads, searches and persists Ilocano with correct source attribution', async () => {
  const storage = memory(), bible = createBibleDataService({ fetcher }), progress = createProgressService({ storage, store: createStore() });
  const reader = createReaderService({ bible, storage, progress });
  reader.setTranslation('ilo'); reader.setBook('GEN', 1);
  const chapter = await reader.load();
  assert.equal(chapter.translation.id, 'ilo'); assert.match(chapter.translation.attribution, /2019 Door43/);
  assert.equal(chapter.verses[0].text, JSON.parse(readFileSync('data/packs/ilocano/GEN.json'))[0].t);
  const search = await bible.search('ilo', 'John 3:16'); assert.equal(search.results[0].book.code, 'JHN');
  assert.equal(createReaderService({ bible, storage, progress }).getState().translation, 'ilo');
});
test('source-empty addresses fail explicitly instead of showing a different translation', async () => {
  const storage = memory(), bible = createBibleDataService({ fetcher }), progress = createProgressService({ storage, store: createStore() });
  const reader = createReaderService({ bible, storage, progress }); reader.setTranslation('ilo');
  for (const address of source.emptySourceVerses) {
    const [, code, chapter, verse] = /^(\S+) (\d+):(\d+)$/.exec(address);
    reader.setBook(code, Number(chapter)); await assert.rejects(reader.peek(Number(verse)), /unavailable/i);
  }
});
test('opened Ilocano books recover from the shared stored-pack path when network fetch fails', async () => {
  const cache = new Map(), packStore = { read: async path => cache.get(path), write: async (path, value) => { cache.set(path, value); return true; } };
  await createBibleDataService({ fetcher, packStore }).loadChapter('ilo', 'GEN', 1);
  const offline = createBibleDataService({ fetcher: async () => { throw new Error('offline'); }, packStore });
  const result = await offline.loadChapter('ilo', 'GEN', 1);
  assert.equal(result.translation.id, 'ilo'); assert.ok(result.verses.length > 0);
});
test('full Ilocano translation is eligible for the existing verified offline manager', () => {
  const manifest = buildScripturePackageManifest(process.cwd(), SCRIPTURE_PACKAGE_SOURCES.find(row => row.translationId === 'ilo'));
  assert.equal(manifest.books.length, 66);
  assert.equal(fullTranslationOfflineEligibility(manifest, manifest.books.map(row => ({ code: row.bookCode, path: row.url }))).eligible, true);
  assert.deepEqual(scripturePackageIdentityForPath('data/packs/ilocano/JHN.json'), { translationId: 'ilo', bookCode: 'JHN' });
});

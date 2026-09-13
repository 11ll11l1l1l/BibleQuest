import assert from 'node:assert/strict';
import test from 'node:test';
import { createOfflineFirstBibleDataService } from '../src/offline/bible-data-service-adapter.js';

function response(payload, { ok = true } = {}) {
  return { ok, async json() { return payload; } };
}

function manifestFor({ folder, bookCode }) {
  return {
    schemaVersion: 1,
    packageId: `${folder}-${bookCode.toLowerCase()}-v1`,
    translationId: folder === 'bible' ? 'bsb' : folder === 'tagalog' ? 'tl' : 'cebocb',
    contentVersion: '2026.09',
    scope: 'book',
    books: [bookCode],
    contentPath: `/offline/${folder}/${bookCode}.json`,
    byteSize: 1,
    generatedAt: '2026-09-13T00:00:00Z',
    checksum: { algorithm: 'sha256', value: 'a'.repeat(64) },
    license: { redistributionAllowed: true, source: 'test fixture' }
  };
}

test('bundled chapter uses verified offline provider and preserves Bible data-service chapter shape', async () => {
  const providerCalls = [];
  const fallbackCalls = [];
  const service = createOfflineFirstBibleDataService({
    manifestResolver: async request => manifestFor(request),
    contentProvider: {
      async load(manifest, options) {
        providerCalls.push({ manifest, options });
        return {
          source: 'offline',
          manifest,
          payload: [
            { c: 1, v: 1, t: 'In the beginning.' },
            { c: 1, v: 2, e: 3, t: 'A ranged verse.' },
            { c: 2, v: 1, t: 'Second chapter.' }
          ]
        };
      }
    },
    fetcher: async input => {
      fallbackCalls.push(input);
      throw new Error('bundled path should not reach fallback fetcher');
    }
  });

  const chapter = await service.loadChapter('bsb', 'JHN', 1);

  assert.equal(providerCalls.length, 1);
  assert.equal(providerCalls[0].manifest.translationId, 'bsb');
  assert.equal(providerCalls[0].manifest.books[0], 'JHN');
  assert.equal(providerCalls[0].options.allowNetwork, true);
  assert.deepEqual(fallbackCalls, []);
  assert.equal(chapter.book.code, 'JHN');
  assert.equal(chapter.translation.id, 'bsb');
  assert.equal(chapter.chapter, 1);
  assert.deepEqual(chapter.verses.map(verse => ({ verse: verse.verse, verseEnd: verse.verseEnd, text: verse.text })), [
    { verse: 1, verseEnd: undefined, text: 'In the beginning.' },
    { verse: 2, verseEnd: 3, text: 'A ranged verse.' }
  ]);
});

test('live Japanese source bypasses offline package resolver/provider and keeps existing remote contract', async () => {
  let resolverCalls = 0;
  let providerCalls = 0;
  const fetchCalls = [];
  const service = createOfflineFirstBibleDataService({
    manifestResolver: async () => { resolverCalls += 1; return null; },
    contentProvider: { async load() { providerCalls += 1; throw new Error('not expected'); } },
    fetcher: async input => {
      fetchCalls.push(input);
      return response({ verses: [{ verse: 1, text: '初めに言があった。' }] });
    }
  });

  const chapter = await service.loadChapter('jko', 'JHN', 1);

  assert.equal(resolverCalls, 0);
  assert.equal(providerCalls, 0);
  assert.equal(fetchCalls.length, 1);
  assert.match(String(fetchCalls[0]), /^https:\/\/api\.getbible\.net\/v2\/japkougo\//);
  assert.equal(chapter.translation.id, 'jko');
  assert.equal(chapter.verses[0].text, '初めに言があった。');
});

test('licensed external-reader translation bypasses offline storage and network fetch', async () => {
  let resolverCalls = 0;
  let providerCalls = 0;
  let fetchCalls = 0;
  const service = createOfflineFirstBibleDataService({
    manifestResolver: async () => { resolverCalls += 1; return null; },
    contentProvider: { async load() { providerCalls += 1; throw new Error('not expected'); } },
    fetcher: async () => { fetchCalls += 1; throw new Error('not expected'); }
  });

  const chapter = await service.loadChapter('nlt', 'JHN', 3);

  assert.equal(resolverCalls, 0);
  assert.equal(providerCalls, 0);
  assert.equal(fetchCalls, 0);
  assert.equal(chapter.translation.id, 'nlt');
  assert.equal(chapter.verses.length, 0);
  assert.match(chapter.external.href, /version=NLT/);
});

test('bundled path falls back to accepted V4 network source when no offline manifest is registered', async () => {
  let providerCalls = 0;
  const fetchCalls = [];
  const service = createOfflineFirstBibleDataService({
    manifestResolver: async () => null,
    contentProvider: { async load() { providerCalls += 1; throw new Error('not expected'); } },
    fetcher: async input => {
      fetchCalls.push(input);
      return response([{ c: 1, v: 1, t: 'Fallback verse.' }]);
    }
  });

  const chapter = await service.loadChapter('tl', 'JHN', 1);

  assert.equal(providerCalls, 0);
  assert.deepEqual(fetchCalls, ['data/packs/tagalog/JHN.json']);
  assert.equal(chapter.translation.id, 'tl');
  assert.equal(chapter.verses[0].text, 'Fallback verse.');
});

test('adapter validates required boundaries', () => {
  assert.throws(() => createOfflineFirstBibleDataService(), /content provider/);
  assert.throws(() => createOfflineFirstBibleDataService({ contentProvider: { load() {} } }), /manifestResolver/);
  assert.throws(() => createOfflineFirstBibleDataService({ contentProvider: { load() {} }, manifestResolver() {}, fetcher: null }), /fetcher/);
});

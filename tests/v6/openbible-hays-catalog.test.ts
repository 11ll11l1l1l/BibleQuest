import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { createOpenBibleHaysStreamingManifest, createOpenBibleNarratorStreamingManifest, loadOpenBibleHaysStreamingManifest, loadOpenBibleNarratorStreamingManifest } from '../../src/v6/reader/openbible-hays-catalog.ts';

const root = new URL('../../', import.meta.url);

test('OpenBible Hays catalog creates direct source URLs for all 1,189 BSB chapters without fake package hashes', async () => {
  const bibleDirectory = new URL('data/packs/bible/', root);
  const files = (await readdir(bibleDirectory)).filter(name => /^[1-3]?[A-Z]{2,3}\.json$/.test(name));
  const books = await Promise.all(files.map(async name => {
    const rows = JSON.parse(await readFile(new URL(name, bibleDirectory), 'utf8'));
    return { code: name.slice(0, -5), name, chapters: Math.max(...rows.map(row => row.c)) };
  }));
  const manifest = createOpenBibleHaysStreamingManifest('bsb-test-scripture-revision', books);
  assert.equal(manifest.segments.length, 1189);
  assert.equal(manifest.source.permissions?.stream, 'allowed');
  assert.equal(manifest.source.permissions?.offlineCopy, 'review-required');
  const gen = manifest.segments.find(segment => segment.id === 'GEN-1');
  const john = manifest.segments.find(segment => segment.id === 'JHN-21');
  assert.equal(gen?.url, 'https://openbible.com/audio/hays/BSB_01_Gen_001_H.mp3');
  assert.equal(john?.url, 'https://openbible.com/audio/hays/BSB_43_Jhn_021_H.mp3');
  assert.equal(gen?.sha256, undefined);
  assert.equal(gen?.byteLength, undefined);
  assert.equal(manifest.source.scriptureContentVersion, 'bsb-test-scripture-revision');
  assert.throws(() => createOpenBibleHaysStreamingManifest('v1', books.slice(0, 65)), /66-book inventory/i);
});

test('OpenBible Souer alternative maps every chapter to its original direct-stream filename', async () => {
  const bibleDirectory = new URL('data/packs/bible/', root);
  const files = (await readdir(bibleDirectory)).filter(name => /^[1-3]?[A-Z]{2,3}\.json$/.test(name));
  const books = await Promise.all(files.map(async name => {
    const rows = JSON.parse(await readFile(new URL(name, bibleDirectory), 'utf8'));
    return { code: name.slice(0, -5), name, chapters: Math.max(...rows.map(row => row.c)) };
  }));
  const manifest = createOpenBibleNarratorStreamingManifest('souer', 'bsb-test-scripture-revision', books);
  assert.equal(manifest.segments.length, 1189);
  assert.equal(manifest.source.source, 'Bob Souer BSB narration (OpenBible direct chapter stream)');
  assert.equal(manifest.segments.find(segment => segment.id === 'GEN-1')?.url,
    'https://openbible.com/audio/souer/BSB_01_Gen_001.mp3');
  assert.equal(manifest.segments.find(segment => segment.id === 'JHN-21')?.url,
    'https://openbible.com/audio/souer/BSB_43_Jhn_021.mp3');
  assert.equal(manifest.source.permissions?.offlineCopy, 'review-required');
});

test('lazy catalog loader pins the stream catalog to the generated current BSB package version', async () => {
  const response = {
    ok: true,
    async json() { return { translationId: 'bsb', contentVersion: 'sha256-current-bsb' }; },
  } as Response;
  const calls: string[] = [];
  const bibleDirectory = new URL('data/packs/bible/', root);
  const files = (await readdir(bibleDirectory)).filter(name => /^[1-3]?[A-Z]{2,3}\.json$/.test(name));
  const books = await Promise.all(files.map(async name => {
    const rows = JSON.parse(await readFile(new URL(name, bibleDirectory), 'utf8'));
    return { code: name.slice(0, -5), name, chapters: Math.max(...rows.map(row => row.c)) };
  }));
  const loaded = await loadOpenBibleHaysStreamingManifest(books, async (url: string | URL | Request) => {
    calls.push(String(url)); return response;
  });
  assert.equal(loaded?.source.scriptureContentVersion, 'sha256-current-bsb');
  assert.equal(loaded?.segments.length, 1189);
  assert.deepEqual(calls, ['/data/v6-scripture-manifests/bsb.json']);
  const wrongTranslation = await loadOpenBibleHaysStreamingManifest(books, async () => ({
    ok: true, async json() { return { translationId: 'tl', contentVersion: 'other' }; },
  } as Response));
  assert.equal(wrongTranslation, null);
});

test('lazy narrator catalogs fail closed on unavailable, malformed, or stale BSB manifest responses', async () => {
  const bibleDirectory = new URL('data/packs/bible/', root);
  const files = (await readdir(bibleDirectory)).filter(name => /^[1-3]?[A-Z]{2,3}\.json$/.test(name));
  const books = await Promise.all(files.map(async name => {
    const rows = JSON.parse(await readFile(new URL(name, bibleDirectory), 'utf8'));
    return { code: name.slice(0, -5), name, chapters: Math.max(...rows.map(row => row.c)) };
  }));
  const unavailable = await loadOpenBibleNarratorStreamingManifest('hays', books, async () => ({ ok: false } as Response));
  const malformedVersion = await loadOpenBibleNarratorStreamingManifest('hays', books, async () => ({
    ok: true, async json() { return { translationId: 'bsb', contentVersion: '  ' }; },
  } as Response));
  const malformedBooks = await loadOpenBibleNarratorStreamingManifest('souer', books.slice(0, 65), async () => ({
    ok: true, async json() { return { translationId: 'bsb', contentVersion: 'bsb-v1' }; },
  } as Response));
  assert.equal(unavailable, null);
  assert.equal(malformedVersion, null);
  assert.equal(malformedBooks, null);
});

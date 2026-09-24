import assert from 'node:assert/strict';
import test from 'node:test';

import {
  OfflineScriptureSearch,
  type InstalledScripturePackage,
  type InstalledScriptureSearchRepository,
} from '../../src/v6/reader/index.ts';

const GEN = Object.freeze({ code: 'GEN', name: 'Genesis', chapters: 50 });
const JHN = Object.freeze({ code: 'JHN', name: 'John', chapters: 21 });
const MAT = Object.freeze({ code: 'MAT', name: 'Matthew', chapters: 28 });

function record(translationId: string, bookCode: string): InstalledScripturePackage {
  return Object.freeze({
    key: `${translationId}:fixture:${bookCode}:${'a'.repeat(64)}`,
    translationId,
    contentVersion: 'fixture',
    bookCode,
    sha256: 'a'.repeat(64),
    bytes: 1,
    installedAt: '2026-09-24T09:00:00.000Z',
  });
}

function bytes(rows: unknown): ArrayBuffer {
  return new TextEncoder().encode(JSON.stringify(rows)).buffer;
}

function repository(
  installed: readonly InstalledScripturePackage[],
  payloads: Readonly<Record<string, ArrayBuffer>>,
) {
  const reads: string[] = [];
  let lists = 0;
  const value: InstalledScriptureSearchRepository = {
    async listInstalled() {
      lists += 1;
      return installed;
    },
    async readInstalledPayload(translationId, bookCode) {
      const key = `${translationId}:${bookCode}`;
      reads.push(key);
      return payloads[key] ?? null;
    },
  };
  return { value, reads, lists: () => lists };
}

test('offline search scans only deliberately installed OT/NT books and never asks for uninstalled books', async () => {
  const source = repository(
    [record('bsb', 'GEN'), record('bsb', 'JHN')],
    {
      'bsb:GEN': bytes([
        { c: 1, v: 1, t: 'fixture beginning target' },
        { c: 1, v: 2, t: 'fixture earth' },
      ]),
      'bsb:JHN': bytes([
        { c: 3, v: 16, t: 'fixture target love' },
        { c: 3, v: 17, t: 'fixture world' },
      ]),
      'bsb:MAT': bytes([{ c: 1, v: 1, t: 'uninstalled target' }]),
    },
  );
  const search = new OfflineScriptureSearch(source.value, [GEN, JHN, MAT]);

  const result = await search.searchText('bsb', 'target', 20);

  assert.equal(result.type, 'text');
  assert.deepEqual(result.results.map((hit) => hit.reference), ['Genesis 1:1', 'John 3:16']);
  assert.deepEqual(source.reads, ['bsb:GEN', 'bsb:JHN']);
  assert.equal(source.reads.includes('bsb:MAT'), false);
});

test('offline search preserves grouped verse ranges and normalizes query whitespace', async () => {
  const source = repository(
    [record('bsb', 'JHN')],
    {
      'bsb:JHN': bytes([
        { c: 3, v: 17, e: 18, t: 'fixture grouped target' },
      ]),
    },
  );
  const search = new OfflineScriptureSearch(source.value, [JHN]);

  const result = await search.searchText('bsb', '  grouped   target  ');

  assert.equal(result.query, 'grouped target');
  assert.equal(result.results[0]?.reference, 'John 3:17-18');
  assert.equal(result.results[0]?.verse, 17);
  assert.equal(result.results[0]?.verseEnd, 18);
});

test('Tagalog remains eligible for installed-only local search without translation substitution', async () => {
  const source = repository(
    [record('tl', 'JHN')],
    {
      'tl:JHN': bytes([{ c: 1, v: 1, t: 'fixture tagalog target' }]),
    },
  );
  const search = new OfflineScriptureSearch(source.value, [JHN]);

  const result = await search.searchText('tl', 'target');

  assert.equal(result.results.length, 1);
  assert.equal(result.results[0]?.book.code, 'JHN');
  assert.deepEqual(source.reads, ['tl:JHN']);
});

test('live Japanese and external NLT fail closed before installed repository reads', async () => {
  for (const translationId of ['jko', 'nlt'] as const) {
    const source = repository([], {});
    const search = new OfflineScriptureSearch(source.value, [GEN, JHN]);

    await assert.rejects(
      search.searchText(translationId, 'target'),
      /Offline Scripture search is unavailable/,
    );
    assert.equal(source.lists(), 0);
    assert.deepEqual(source.reads, []);
  }
});

test('malformed or missing installed package bytes are skipped instead of fabricating results', async () => {
  const source = repository(
    [record('bsb', 'GEN'), record('bsb', 'JHN')],
    {
      'bsb:GEN': bytes([{ c: 51, v: 1, t: 'invalid target' }]),
    },
  );
  const search = new OfflineScriptureSearch(source.value, [GEN, JHN]);

  const result = await search.searchText('bsb', 'target');

  assert.equal(result.results.length, 0);
  assert.deepEqual(result.skippedBooks.map((row) => row.code), ['GEN', 'JHN']);
  assert.match(result.skippedBooks[0]?.message ?? '', /invalid verse metadata/);
  assert.match(result.skippedBooks[1]?.message ?? '', /bytes are unavailable/);
});

test('mismatched installed translation metadata is rejected without reading package bytes', async () => {
  const source = repository(
    [record('tl', 'GEN')],
    {
      'bsb:GEN': bytes([{ c: 1, v: 1, t: 'target' }]),
    },
  );
  const search = new OfflineScriptureSearch(source.value, [GEN]);

  const result = await search.searchText('bsb', 'target');

  assert.equal(result.results.length, 0);
  assert.equal(result.skippedBooks.length, 1);
  assert.match(result.skippedBooks[0]?.message ?? '', /does not match/);
  assert.deepEqual(source.reads, []);
});

test('offline search enforces bounded queries and result limits before repository reads', async () => {
  const source = repository([record('bsb', 'GEN')], {});
  const search = new OfflineScriptureSearch(source.value, [GEN]);

  await assert.rejects(search.searchText('bsb', '  a '), /at least 3 characters/);
  await assert.rejects(search.searchText('bsb', 'target', 0), /between 1 and 100/);
  await assert.rejects(search.searchText('bsb', 'target', 101), /between 1 and 100/);
  assert.equal(source.lists(), 0);
  assert.deepEqual(source.reads, []);
});

test('duplicate or overlapping installed verses fail closed for that book', async () => {
  const source = repository(
    [record('bsb', 'JHN')],
    {
      'bsb:JHN': bytes([
        { c: 3, v: 16, e: 17, t: 'fixture target one' },
        { c: 3, v: 17, t: 'fixture target duplicate' },
      ]),
    },
  );
  const search = new OfflineScriptureSearch(source.value, [JHN]);

  const result = await search.searchText('bsb', 'target');

  assert.equal(result.results.length, 0);
  assert.equal(result.skippedBooks.length, 1);
  assert.match(result.skippedBooks[0]?.message ?? '', /duplicate or overlapping/);
});

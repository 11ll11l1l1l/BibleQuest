import assert from 'node:assert/strict';
import test from 'node:test';

import type { ReaderBookRef, ReaderProgress, ReaderProgressRepository } from '../../src/v6/reader/contracts.ts';
import { createReaderProgress, recordReaderProgress } from '../../src/v6/reader/progress-policy.ts';

const GEN: ReaderBookRef = Object.freeze({ code: 'GEN', name: 'Genesis', chapters: 50 });
const catalog = new Map([[GEN.code, GEN]]);

test('progress preserves EN/TL/JA translation and exact normalized reference', () => {
  for (const translationId of ['bsb', 'tl', 'jko'] as const) {
    const progress = createReaderProgress(
      { translationId, bookCode: 'gen', chapter: 2, verse: 7 },
      '2026-09-19T06:00:00+09:00',
      catalog,
    );
    assert.deepEqual(progress.location, { translationId, bookCode: 'GEN', chapter: 2, verse: 7 });
    assert.equal(progress.readAt, '2026-09-18T21:00:00.000Z');
  }
});

test('invalid references and timestamps fail closed before persistence', async () => {
  const writes: ReaderProgress[] = [];
  const repository: ReaderProgressRepository = {
    async readLastPosition() { return writes.at(-1) ?? null; },
    async recordRead(progress) { writes.push(progress); },
  };

  await assert.rejects(
    recordReaderProgress(repository, { translationId: 'bsb', bookCode: 'GEN', chapter: 51 }, new Date().toISOString(), catalog),
    /Invalid chapter/,
  );
  await assert.rejects(
    recordReaderProgress(repository, { translationId: 'tl', bookCode: 'GEN', chapter: 1 }, 'not-a-date', catalog),
    /valid readAt timestamp/,
  );
  assert.equal(writes.length, 0);
});

test('progress persistence is an explicit command and can restore the last position', async () => {
  let stored: ReaderProgress | null = null;
  const repository: ReaderProgressRepository = {
    async readLastPosition() { return stored; },
    async recordRead(progress) { stored = progress; },
  };

  const written = await recordReaderProgress(
    repository,
    { translationId: 'jko', bookCode: 'GEN', chapter: 3, verse: 16 },
    '2026-09-19T15:00:00+09:00',
    catalog,
  );
  assert.deepEqual(await repository.readLastPosition(), written);
  assert.equal(written.location.translationId, 'jko');
  assert.equal(written.location.verse, 16);
});

import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  computeHaysAudioInventoryDigest,
  expectedHaysAudioFiles,
} from '../../scripts/v6-hays-source-inventory.mjs';
import { materializeHaysRuntimeSource } from '../../scripts/v6-materialize-hays-runtime-source.mjs';
import { validateBsbAlignmentManifest } from '../../scripts/v6-bsb-alignment-manifest.mjs';
import { validateChapterAlignment } from '../../src/v6/reader/audio-alignment.ts';
import {
  bindOpenBibleHaysAlignmentIdentity,
  bindOpenBibleHaysSourceIdentity,
  createOpenBibleNarratorStreamingManifest,
  loadOpenBibleHaysAlignmentBundle,
} from '../../src/v6/reader/openbible-hays-catalog.ts';

function inventoryFixture() {
  const files = expectedHaysAudioFiles().map((row, index) => ({
    ...row,
    byteLength: 1000 + index,
    sha256: index.toString(16).padStart(64, '0'),
    durationSeconds: 10 + index / 1000,
    sourceUrl: 'https://openbible.com/audio/hays/' + row.filename,
  }));
  const inventorySha256 = computeHaysAudioInventoryDigest(files);
  return {
    schemaVersion: 1,
    translationId: 'bsb',
    narrator: 'Barry Hays',
    source: 'OpenBible Barry Hays',
    sourceBaseUrl: 'https://openbible.com/audio/hays/',
    chapters: files.length,
    totalBytes: files.reduce((sum, row) => sum + row.byteLength, 0),
    totalDurationSeconds: Number(files.reduce((sum, row) => sum + row.durationSeconds, 0).toFixed(6)),
    inventorySha256,
    contentVersion: 'sha256-' + inventorySha256,
    files,
  };
}

test('materializes only a complete certified Hays inventory into runtime data', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'bq-v6-hays-runtime-'));
  try {
    const input = join(directory, 'inventory.json');
    const output = join(directory, 'data', 'v6-audio', 'bsb-hays-source-inventory.json');
    const inventory = inventoryFixture();
    await writeFile(input, JSON.stringify(inventory), 'utf8');

    const result = await materializeHaysRuntimeSource({
      inventoryPath: input,
      outputPath: output,
      expectedInventorySha256: inventory.inventorySha256,
    });

    assert.equal(result.chapters, 1189);
    assert.equal(result.inventorySha256, inventory.inventorySha256);
    assert.equal(result.contentVersion, inventory.contentVersion);
    assert.deepEqual(JSON.parse(await readFile(output, 'utf8')), {
      schemaVersion: 1,
      translationId: 'bsb',
      narrator: 'Barry Hays',
      inventorySha256: inventory.inventorySha256,
      contentVersion: inventory.contentVersion,
      chapters: 1189,
      totalBytes: inventory.totalBytes,
      segments: inventory.files.map(row => [row.byteLength, row.sha256]),
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('refuses a source artifact whose exact certified digest does not match', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'bq-v6-hays-runtime-'));
  try {
    const input = join(directory, 'inventory.json');
    const output = join(directory, 'runtime.json');
    const inventory = inventoryFixture();
    await writeFile(input, JSON.stringify(inventory), 'utf8');
    await assert.rejects(
      materializeHaysRuntimeSource({
        inventoryPath: input,
        outputPath: output,
        expectedInventorySha256: 'f'.repeat(64),
      }),
      /digest mismatch/i,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('real Hays timing corpus binds every canonical chapter and verse to the certified offline source', async () => {
  const source = JSON.parse(await readFile(new URL('../../data/v6-audio/bsb-hays-source-inventory.json', import.meta.url), 'utf8'));
  const timing = JSON.parse(await readFile(new URL('../../data/v6-audio/bsb-hays-alignment.json', import.meta.url), 'utf8'));
  assert.equal(source.narrator, 'Barry Hays');
  assert.equal(source.inventorySha256, '522c547472358cc13290f55ddf0ec1d2e2987ecdd44032dc0edfb1c4628310c2');
  assert.equal(source.contentVersion, timing.audioContentVersion);
  assert.equal(source.inventorySha256, timing.audioInventorySha256);
  const validation = validateBsbAlignmentManifest(timing, {
    requireComplete: true,
    audioInventorySha256: source.inventorySha256,
    audioContentVersion: source.contentVersion,
  });
  assert.equal(validation.valid, true, validation.issues.join('; '));
  const files = expectedHaysAudioFiles();
  const counts = new Map<string, number>();
  for (const row of files) counts.set(row.book, (counts.get(row.book) ?? 0) + 1);
  const books = [...counts].map(([code, chapters]) => ({ code, name: code, chapters }));
  const bundle = await loadOpenBibleHaysAlignmentBundle(timing.scriptureContentVersion, books,
    (async () => new Response(JSON.stringify(timing))) as typeof fetch);
  assert.ok(bundle, 'Current real corpus must load through the runtime validator.');
  const hays = bindOpenBibleHaysAlignmentIdentity(bindOpenBibleHaysSourceIdentity(
    createOpenBibleNarratorStreamingManifest('hays', timing.scriptureContentVersion, books), source,
  ), bundle);
  assert.equal(hays.segments.length, 1189);
  const byChapter = new Map(bundle.chapters.map(row => [row.book + ':' + row.chapter, row]));
  for (const [index, file] of files.entries()) {
    const row = byChapter.get(file.book + ':' + file.chapter);
    assert.ok(row);
    assert.equal(row.audioByteLength, source.segments[index][0]);
    assert.equal(row.audioSha256, source.segments[index][1]);
    const pack = JSON.parse(await readFile(new URL('../../data/packs/bible/' + file.book + '.json', import.meta.url), 'utf8'));
    const verseNumbers = pack.filter((verse: { c: number }) => verse.c === file.chapter)
      .map((verse: { v: number }) => verse.v).sort((a: number, b: number) => a - b);
    const coverage = validateChapterAlignment(row, { book: file.book, chapter: file.chapter, verseNumbers });
    assert.equal(coverage.valid, true, file.book + ':' + file.chapter + ': ' + coverage.issues.join('; '));
  }
  const souer = createOpenBibleNarratorStreamingManifest('souer', timing.scriptureContentVersion, books);
  assert.throws(() => bindOpenBibleHaysSourceIdentity(souer, source), /does not match/);
  assert.throws(() => bindOpenBibleHaysAlignmentIdentity(souer, bundle), /does not match/);
});

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

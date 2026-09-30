import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

import { exportCurrentBsbAlignmentText } from '../../scripts/v6-export-current-bsb-alignment-text.mjs';
import { SCRIPTURE_PACKAGE_SOURCES, buildScripturePackageManifest } from '../../scripts/v6-generate-scripture-manifests.mjs';

test('current BSB alignment export is complete, deterministic and bound to the Reader Scripture revision', async () => {
  const output = await mkdtemp(join(tmpdir(), 'bq-v6-bsb-align-'));
  const root = resolve(new URL('../..', import.meta.url).pathname);
  try {
    const result = await exportCurrentBsbAlignmentText({ root, outputDirectory: output });
    const bsb = SCRIPTURE_PACKAGE_SOURCES.find(source => source.translationId === 'bsb');
    assert.ok(bsb);
    const scripture = buildScripturePackageManifest(root, bsb);
    assert.equal(result.scriptureContentVersion, scripture.contentVersion);
    assert.equal(result.books, 66);
    assert.equal(result.chapters, 1189);
    assert.ok(result.verses > 30000);
    assert.match(result.inventorySha256, /^[a-f0-9]{64}$/);

    const genesis = (await readFile(join(output, 'GEN_001_BSB.txt'), 'utf8')).trimEnd().split('\n');
    assert.equal(genesis.length, 31);
    assert.equal(genesis[2], 'And God said, “Let there be light,” and there was light.');
    assert.match(genesis[4], /And there was evening, and there was morning/);

    const diskManifest = JSON.parse(await readFile(join(output, '_biblequest-bsb-alignment-export.json'), 'utf8'));
    assert.equal(diskManifest.inventorySha256, result.inventorySha256);
    assert.equal(diskManifest.files.length, 1189);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test('current BSB alignment export refuses a non-empty output directory', async () => {
  const output = await mkdtemp(join(tmpdir(), 'bq-v6-bsb-align-nonempty-'));
  const root = resolve(new URL('../..', import.meta.url).pathname);
  try {
    await Bun?.write?.(join(output, 'stale.txt'), 'stale');
  } catch {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(join(output, 'stale.txt'), 'stale');
  }
  try {
    await assert.rejects(
      exportCurrentBsbAlignmentText({ root, outputDirectory: output }),
      /must be empty/i,
    );
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

import assert from 'node:assert/strict';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildBsbAlignmentImportCommand,
  buildBsbRegenerationFinalizeInputs,
} from '../../scripts/v6-run-bsb-alignment-regeneration.mjs';
import {
  BSB_ALIGN_REVISION,
  BSB_ALIGN_TREE,
} from '../../scripts/v6-prepare-bsb-alignment-regeneration.mjs';
import {
  computeHaysAudioInventoryDigest,
  expectedHaysAudioFiles,
} from '../../scripts/v6-hays-source-inventory.mjs';

function fakeAudioInventory() {
  const files = expectedHaysAudioFiles().map(row => ({
    ...row,
    byteLength: 2048,
    sha256: 'a'.repeat(64),
    durationSeconds: 90,
    sourceUrl: 'https://openbible.com/audio/hays/' + row.filename,
  }));
  const inventorySha256 = computeHaysAudioInventoryDigest(files);
  return Object.freeze({
    schemaVersion: 1,
    translationId: 'bsb',
    narrator: 'Barry Hays',
    source: 'OpenBible Barry Hays',
    sourceBaseUrl: 'https://openbible.com/audio/hays/',
    chapters: 1189,
    totalBytes: files.reduce((sum, row) => sum + row.byteLength, 0),
    totalDurationSeconds: files.reduce((sum, row) => sum + row.durationSeconds, 0),
    inventorySha256,
    contentVersion: 'sha256-' + inventorySha256,
    files,
  });
}

function fakePlan(audioInventory = fakeAudioInventory()) {
  return Object.freeze({
    schemaVersion: 2,
    translationId: 'bsb',
    alignmentRevision: BSB_ALIGN_REVISION,
    alignmentTree: BSB_ALIGN_TREE,
    scriptureContentVersion: 'sha256-current-bsb',
    audioContentVersion: audioInventory.contentVersion,
    audioInventorySha256: audioInventory.inventorySha256,
    expectedChapters: 1189,
    alignerDirectory: '/tmp/bsb-align',
    audioDirectory: '/tmp/hays',
    workspaceDirectory: '/tmp/workspace',
    textDirectory: '/tmp/workspace/text',
    outputDirectory: '/tmp/workspace/output',
    audioInventoryPath: '/tmp/workspace/audio-source-inventory.json',
  });
}

test('BSB regeneration finalizer binds exact Hays inventory to deployable runtime provenance', () => {
  const inventory = fakeAudioInventory();
  const plan = fakePlan(inventory);
  const finalize = buildBsbRegenerationFinalizeInputs(plan, inventory);

  assert.equal(finalize.metadata.translationId, 'bsb');
  assert.equal(finalize.metadata.source, 'Barry Hays BSB narration (OpenBible direct chapter stream)');
  assert.match(finalize.metadata.license, /CC0 1\.0 declared by the BSB Audio Bible project/);
  assert.equal(finalize.metadata.alignmentSource, 'BSB-publishing/bsb-align');
  assert.equal(finalize.metadata.alignmentRevision, BSB_ALIGN_REVISION);
  assert.equal(finalize.metadata.contentVersion, inventory.contentVersion);
  assert.equal(finalize.durations.length, 1189);
  assert.deepEqual(finalize.durations[0], { book: 'GEN', chapter: 1, durationSeconds: 90 });
  assert.equal(finalize.candidateManifestPath, '/tmp/workspace/bsb-hays-alignment.json');
  assert.equal(finalize.verseMapPath, '/tmp/workspace/text/_biblequest-bsb-alignment-export.json');
});

test('BSB regeneration import command is full-corpus, exact-audio and verse-map bound', () => {
  const inventory = fakeAudioInventory();
  const plan = fakePlan(inventory);
  const finalize = buildBsbRegenerationFinalizeInputs(plan, inventory);
  const command = buildBsbAlignmentImportCommand(plan, finalize, {
    node: '/usr/bin/node',
    root: '/repo',
  });

  assert.equal(command.executable, '/usr/bin/node');
  assert.equal(command.cwd, '/repo');
  assert.equal(command.args[0], join('/repo', 'scripts', 'v6-import-bsb-word-alignments.mjs'));
  assert.ok(command.args.includes('--verse-map'));
  assert.ok(command.args.includes(finalize.verseMapPath));
  assert.ok(command.args.includes('--audio-inventory'));
  assert.ok(command.args.includes(plan.audioInventoryPath));
  assert.ok(command.args.includes('--manifest-output'));
  assert.ok(command.args.includes(finalize.candidateManifestPath));
  assert.equal(command.args.includes('--allow-partial'), false);
});

test('BSB regeneration finalizer rejects tampered audio identity', () => {
  const inventory = fakeAudioInventory();
  const plan = fakePlan(inventory);
  assert.throws(
    () => buildBsbRegenerationFinalizeInputs(plan, {
      ...inventory,
      inventorySha256: 'b'.repeat(64),
      contentVersion: 'sha256-' + 'b'.repeat(64),
    }),
    /audio inventory does not match/i,
  );
  assert.throws(
    () => buildBsbRegenerationFinalizeInputs({
      ...plan,
      audioContentVersion: 'sha256-' + 'c'.repeat(64),
    }, inventory),
    /reviewed exact-identity BSB regeneration plan/i,
  );
});

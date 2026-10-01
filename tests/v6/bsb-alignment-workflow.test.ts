import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildBsbAlignmentImportCommand,
  buildBsbRegenerationFinalizeInputs,
  loadBsbRegenerationResumePlan,
} from '../../scripts/v6-run-bsb-alignment-regeneration.mjs';
import {
  BSB_ALIGN_REVISION,
  BSB_ALIGN_TREE,
} from '../../scripts/v6-prepare-bsb-alignment-regeneration.mjs';
import {
  computeHaysAudioInventoryDigest,
  expectedHaysAudioFiles,
} from '../../scripts/v6-hays-source-inventory.mjs';

function fakeAudioInventory(hashCharacter = 'a') {
  const files = expectedHaysAudioFiles().map(row => ({
    ...row,
    byteLength: 2048,
    sha256: hashCharacter.repeat(64),
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

function fakePlan(audioInventory = fakeAudioInventory(), paths = {}) {
  return Object.freeze({
    schemaVersion: 2,
    translationId: 'bsb',
    alignmentRevision: BSB_ALIGN_REVISION,
    alignmentTree: BSB_ALIGN_TREE,
    scriptureContentVersion: 'sha256-current-bsb',
    textInventorySha256: 'd'.repeat(64),
    audioContentVersion: audioInventory.contentVersion,
    audioInventorySha256: audioInventory.inventorySha256,
    expectedChapters: 1189,
    expectedOutputFiles: expectedHaysAudioFiles().map(row =>
      row.book + '/' + row.book + '_' + String(row.chapter).padStart(3, '0') + '_words.json'),
    alignerDirectory: paths.alignerDirectory || '/tmp/bsb-align',
    audioDirectory: paths.audioDirectory || '/tmp/hays',
    workspaceDirectory: paths.workspaceDirectory || '/tmp/workspace',
    textDirectory: paths.textDirectory || '/tmp/workspace/text',
    outputDirectory: paths.outputDirectory || '/tmp/workspace/output',
    audioInventoryPath: paths.audioInventoryPath || '/tmp/workspace/audio-source-inventory.json',
  });
}

test('BSB regeneration finalizer binds exact Hays inventory to deployable runtime provenance', () => {
  const inventory = fakeAudioInventory();
  const plan = fakePlan(inventory);
  const finalize = buildBsbRegenerationFinalizeInputs(plan, inventory);

  assert.equal(finalize.metadata.translationId, 'bsb');
  assert.equal(finalize.metadata.source, 'Barry Hays BSB narration (OpenBible direct chapter stream)');
  assert.match(finalize.metadata.license, /CC0 1\.0 public-domain dedication by the BSB Audio Bible project/);
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


test('BSB regeneration resume accepts only the original exact text/audio/aligner identity', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'bq-v6-bsb-resume-'));
  const alignerDirectory = join(temp, 'bsb-align');
  const audioDirectory = join(temp, 'audio');
  const workspaceDirectory = join(temp, 'workspace');
  const textDirectory = join(workspaceDirectory, 'text');
  const outputDirectory = join(workspaceDirectory, 'output');
  const audioInventoryPath = join(workspaceDirectory, 'audio-source-inventory.json');
  const planPath = join(workspaceDirectory, 'regeneration-plan.json');
  await Promise.all([
    mkdir(alignerDirectory, { recursive: true }),
    mkdir(audioDirectory, { recursive: true }),
    mkdir(textDirectory, { recursive: true }),
    mkdir(outputDirectory, { recursive: true }),
  ]);

  const inventory = fakeAudioInventory();
  const plan = fakePlan(inventory, {
    alignerDirectory,
    audioDirectory,
    workspaceDirectory,
    textDirectory,
    outputDirectory,
    audioInventoryPath,
  });
  const textManifest = {
    schemaVersion: 1,
    translationId: 'bsb',
    scriptureContentVersion: plan.scriptureContentVersion,
    inventorySha256: plan.textInventorySha256,
    chapters: 1189,
    files: Array.from({ length: 1189 }, (_, index) => ({ index })),
  };

  await writeFile(planPath, JSON.stringify(plan, null, 2) + '\n');
  await writeFile(audioInventoryPath, JSON.stringify(inventory, null, 2) + '\n');
  await writeFile(join(textDirectory, '_biblequest-bsb-alignment-export.json'), JSON.stringify(textManifest, null, 2) + '\n');

  const reviewedGit = (_directory, args) => {
    if (args[0] === 'rev-parse' && args[1] === 'HEAD') return BSB_ALIGN_REVISION;
    if (args[0] === 'rev-parse' && args[1] === 'HEAD^{tree}') return BSB_ALIGN_TREE;
    if (args[0] === 'status') return '';
    throw new Error('Unexpected git query: ' + args.join(' '));
  };

  try {
    const resumed = await loadBsbRegenerationResumePlan({
      planPath,
      gitResolver: reviewedGit,
      audioInventoryResolver: async ({ audioDirectory: current }) => {
        assert.equal(current, audioDirectory);
        return inventory;
      },
    });
    assert.equal(resumed.plan.audioInventorySha256, inventory.inventorySha256);
    assert.equal(resumed.audioInventory.contentVersion, inventory.contentVersion);

    const changedInventory = fakeAudioInventory('b');
    await assert.rejects(
      loadBsbRegenerationResumePlan({
        planPath,
        gitResolver: reviewedGit,
        audioInventoryResolver: async () => changedInventory,
      }),
      /staged Hays audio files changed/i,
    );

    await assert.rejects(
      loadBsbRegenerationResumePlan({
        planPath,
        gitResolver: (_directory, args) => args[0] === 'status' ? ' M align_book.py' : reviewedGit(_directory, args),
        audioInventoryResolver: async () => inventory,
      }),
      /tracked modifications/i,
    );
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

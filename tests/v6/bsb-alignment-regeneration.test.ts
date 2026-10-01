import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  BSB_ALIGN_REVISION,
  BSB_ALIGN_TREE,
  buildBsbAlignmentCommand,
  inspectBsbAlignmentRegeneration,
  prepareBsbAlignmentRegeneration,
} from '../../scripts/v6-prepare-bsb-alignment-regeneration.mjs';
import { SCRIPTURE_PACKAGE_SOURCES, buildScripturePackageManifest } from '../../scripts/v6-generate-scripture-manifests.mjs';
import { computeHaysAudioInventoryDigest, expectedHaysAudioFiles, snapshotStagedHaysSource } from '../../scripts/v6-hays-source-inventory.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));

function fakeAudioInventory() {
  const files = expectedHaysAudioFiles().map(row => ({
    ...row,
    byteLength: 1000,
    sha256: 'b'.repeat(64),
    durationSeconds: 100,
    sourceUrl: 'https://openbible.com/audio/hays/' + row.filename,
  }));
  const digest = computeHaysAudioInventoryDigest(files);
  return {
    schemaVersion: 1,
    translationId: 'bsb',
    narrator: 'Barry Hays',
    source: 'OpenBible Barry Hays',
    sourceBaseUrl: 'https://openbible.com/audio/hays/',
    chapters: 1189,
    totalBytes: 1189000,
    totalDurationSeconds: 118900,
    inventorySha256: digest,
    contentVersion: 'sha256-' + digest,
    files,
  };
}

function reviewedGit(_directory: string, args: readonly string[]) {
  if (args[0] === 'rev-parse' && args[1] === 'HEAD') return BSB_ALIGN_REVISION;
  if (args[0] === 'rev-parse' && args[1] === 'HEAD^{tree}') return BSB_ALIGN_TREE;
  if (args[0] === 'status') return '';
  throw new Error('Unexpected git query: ' + args.join(' '));
}

test('BSB regeneration handoff pins the reviewed aligner and exact current Reader text', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'bq-v6-bsb-regeneration-'));
  const aligner = join(temp, 'bsb-align');
  const audio = join(temp, 'audio');
  const workspace = join(temp, 'workspace');
  await mkdir(aligner);
  await mkdir(audio);
  try {
    const plan = await prepareBsbAlignmentRegeneration({
      root,
      alignerDirectory: aligner,
      audioDirectory: audio,
      workspaceDirectory: workspace,
      gitResolver: reviewedGit,
      audioInventoryResolver: async () => fakeAudioInventory(),
    });
    const bsb = SCRIPTURE_PACKAGE_SOURCES.find(source => source.translationId === 'bsb');
    assert.ok(bsb);
    const scripture = buildScripturePackageManifest(root, bsb);
    assert.equal(plan.alignmentRevision, BSB_ALIGN_REVISION);
    assert.equal(plan.alignmentTree, BSB_ALIGN_TREE);
    assert.equal(plan.scriptureContentVersion, scripture.contentVersion);
    assert.equal(plan.expectedChapters, 1189);
    assert.equal(plan.audioContentVersion, fakeAudioInventory().contentVersion);
    assert.equal(plan.audioInventorySha256, fakeAudioInventory().inventorySha256);
    assert.equal(plan.audioTotalBytes, 1189000);
    assert.equal(plan.expectedOutputFiles.length, 1189);
    assert.ok(plan.expectedOutputFiles.includes('GEN/GEN_001_words.json'));
    assert.ok(plan.expectedOutputFiles.includes('REV/REV_022_words.json'));

    const diskPlan = JSON.parse(await readFile(join(workspace, 'regeneration-plan.json'), 'utf8'));
    assert.equal(diskPlan.textInventorySha256, plan.textInventorySha256);
    assert.equal(diskPlan.scriptureContentVersion, scripture.contentVersion);
    assert.equal(diskPlan.audioContentVersion, plan.audioContentVersion);
    const diskAudio = JSON.parse(await readFile(join(workspace, 'audio-source-inventory.json'), 'utf8'));
    assert.equal(diskAudio.inventorySha256, plan.audioInventorySha256);
    assert.equal(diskAudio.files.length, 1189);

    const command = buildBsbAlignmentCommand(plan);
    assert.equal(command.executable, 'python3');
    assert.equal(command.cwd, aligner);
    assert.deepEqual(command.args.slice(1), [
      '--all',
      '--audio-dir', audio,
      '--text-dir', join(workspace, 'text'),
      '--output-dir', join(workspace, 'output'),
    ]);

    const report = await inspectBsbAlignmentRegeneration(plan);
    assert.equal(report.complete, false);
    assert.equal(report.generatedChapters, 0);
    assert.equal(report.missing.length, 1189);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('BSB regeneration handoff refuses stale or modified upstream aligner state', async () => {
  for (const mode of ['revision', 'tree', 'dirty'] as const) {
    const temp = await mkdtemp(join(tmpdir(), 'bq-v6-bsb-regeneration-reject-'));
    const aligner = join(temp, 'bsb-align');
    const audio = join(temp, 'audio');
    const workspace = join(temp, 'workspace');
    await mkdir(aligner);
    await mkdir(audio);
    const resolver = (_directory: string, args: readonly string[]) => {
      if (args[0] === 'rev-parse' && args[1] === 'HEAD') return mode === 'revision' ? '0'.repeat(40) : BSB_ALIGN_REVISION;
      if (args[0] === 'rev-parse' && args[1] === 'HEAD^{tree}') return mode === 'tree' ? '1'.repeat(40) : BSB_ALIGN_TREE;
      if (args[0] === 'status') return mode === 'dirty' ? ' M align_book.py' : '';
      throw new Error('Unexpected git query');
    };
    try {
      await assert.rejects(
        prepareBsbAlignmentRegeneration({
          root,
          alignerDirectory: aligner,
          audioDirectory: audio,
          workspaceDirectory: workspace,
          gitResolver: resolver,
          audioInventoryResolver: async () => fakeAudioInventory(),
        }),
        /reviewed immutable revision|reviewed immutable tree|tracked modifications/i,
      );
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  }
});


test('Hays source inventory enumerates the canonical OpenBible chapter filenames and fails closed on missing bytes', async () => {
  const expected = expectedHaysAudioFiles();
  assert.equal(expected.length, 1189);
  assert.deepEqual(expected[0], { book: 'GEN', chapter: 1, filename: 'BSB_01_Gen_001_H.mp3' });
  assert.deepEqual(expected.at(-1), { book: 'REV', chapter: 22, filename: 'BSB_66_Rev_022_H.mp3' });

  const temp = await mkdtemp(join(tmpdir(), 'bq-v6-hays-source-empty-'));
  try {
    await assert.rejects(
      snapshotStagedHaysSource({ audioDirectory: temp, durationResolver: async () => 1 }),
      /exactly the canonical 1,189 OpenBible chapter MP3s.*missing=1189/i,
    );
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('regeneration command rejects a plan whose audio content identity no longer matches its inventory digest', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'bq-v6-bsb-audio-identity-reject-'));
  const aligner = join(temp, 'bsb-align');
  const audio = join(temp, 'audio');
  const workspace = join(temp, 'workspace');
  await mkdir(aligner);
  await mkdir(audio);
  try {
    const plan = await prepareBsbAlignmentRegeneration({
      root,
      alignerDirectory: aligner,
      audioDirectory: audio,
      workspaceDirectory: workspace,
      gitResolver: reviewedGit,
      audioInventoryResolver: async () => fakeAudioInventory(),
    });
    assert.throws(
      () => buildBsbAlignmentCommand({ ...plan, audioContentVersion: 'sha256-' + 'c'.repeat(64) }),
      /reviewed BibleQuest BSB regeneration plan/i,
    );
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

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

const root = fileURLToPath(new URL('../..', import.meta.url));

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
    });
    const bsb = SCRIPTURE_PACKAGE_SOURCES.find(source => source.translationId === 'bsb');
    assert.ok(bsb);
    const scripture = buildScripturePackageManifest(root, bsb);
    assert.equal(plan.alignmentRevision, BSB_ALIGN_REVISION);
    assert.equal(plan.alignmentTree, BSB_ALIGN_TREE);
    assert.equal(plan.scriptureContentVersion, scripture.contentVersion);
    assert.equal(plan.expectedChapters, 1189);
    assert.equal(plan.expectedOutputFiles.length, 1189);
    assert.ok(plan.expectedOutputFiles.includes('GEN/GEN_001_words.json'));
    assert.ok(plan.expectedOutputFiles.includes('REV/REV_022_words.json'));

    const diskPlan = JSON.parse(await readFile(join(workspace, 'regeneration-plan.json'), 'utf8'));
    assert.equal(diskPlan.textInventorySha256, plan.textInventorySha256);
    assert.equal(diskPlan.scriptureContentVersion, scripture.contentVersion);

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
        }),
        /reviewed immutable revision|reviewed immutable tree|tracked modifications/i,
      );
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  }
});

import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BSB_ALIGN_REVISION,
  BSB_ALIGN_TREE,
  buildBsbAlignmentCommand,
  inspectBsbAlignmentRegeneration,
  prepareBsbAlignmentRegeneration,
} from './v6-prepare-bsb-alignment-regeneration.mjs';
import { validateBsbAlignmentManifest } from './v6-bsb-alignment-manifest.mjs';
import { validateHaysAudioInventory } from './v6-hays-source-inventory.mjs';
import { stageReusableBsbAlignments } from './v6-stage-bsb-alignment-reuse.mjs';

const EXPECTED_CHAPTERS = 1189;
const HAYS_SOURCE = 'Barry Hays BSB narration (OpenBible direct chapter stream)';
const HAYS_LICENSE = 'CC0 1.0 declared by the BSB Audio Bible project; exact files remain subject to review';
const ALIGNMENT_SOURCE = 'BSB-publishing/bsb-align';

function fail(message) {
  throw new Error(message);
}

function defaultCommandRunner(command) {
  execFileSync(command.executable, command.args, {
    cwd: command.cwd,
    stdio: 'inherit',
  });
}

function assertPlan(plan) {
  if (!plan || plan.schemaVersion !== 2 || plan.translationId !== 'bsb'
    || plan.alignmentRevision !== BSB_ALIGN_REVISION || plan.alignmentTree !== BSB_ALIGN_TREE
    || plan.expectedChapters !== EXPECTED_CHAPTERS
    || !/^sha256-[a-f0-9]{64}$/.test(String(plan.audioContentVersion ?? ''))
    || !/^[a-f0-9]{64}$/.test(String(plan.audioInventorySha256 ?? ''))
    || plan.audioContentVersion !== 'sha256-' + plan.audioInventorySha256) {
    fail('A reviewed exact-identity BSB regeneration plan is required.');
  }
}

export function buildBsbRegenerationFinalizeInputs(plan, audioInventory) {
  assertPlan(plan);
  const validation = validateHaysAudioInventory(audioInventory, { requireComplete: true });
  if (!validation.valid
    || audioInventory.inventorySha256 !== plan.audioInventorySha256
    || audioInventory.contentVersion !== plan.audioContentVersion
    || audioInventory.files.length !== EXPECTED_CHAPTERS) {
    fail('Exact Hays audio inventory does not match the regeneration plan.');
  }

  const metadata = Object.freeze({
    translationId: 'bsb',
    source: HAYS_SOURCE,
    license: HAYS_LICENSE,
    alignmentSource: ALIGNMENT_SOURCE,
    alignmentRevision: plan.alignmentRevision,
    contentVersion: plan.audioContentVersion,
  });
  const durations = Object.freeze(audioInventory.files.map(row => Object.freeze({
    book: row.book,
    chapter: row.chapter,
    durationSeconds: row.durationSeconds,
  })));

  return Object.freeze({
    metadata,
    durations,
    verseMapPath: join(plan.textDirectory, '_biblequest-bsb-alignment-export.json'),
    alignmentRowsPath: join(plan.workspaceDirectory, 'bsb-hays-alignments.json'),
    candidateManifestPath: join(plan.workspaceDirectory, 'bsb-hays-alignment.json'),
    metadataPath: join(plan.workspaceDirectory, 'hays-source-metadata.json'),
    durationsPath: join(plan.workspaceDirectory, 'hays-durations.json'),
  });
}

export function buildBsbAlignmentImportCommand(plan, finalize, { node = process.execPath, root = process.cwd() } = {}) {
  assertPlan(plan);
  if (!finalize || typeof finalize !== 'object') fail('BSB regeneration finalize inputs are required.');
  return Object.freeze({
    executable: node,
    cwd: resolve(root),
    args: Object.freeze([
      resolve(root, 'scripts', 'v6-import-bsb-word-alignments.mjs'),
      plan.outputDirectory,
      finalize.metadataPath,
      finalize.durationsPath,
      finalize.alignmentRowsPath,
      '--verse-map', finalize.verseMapPath,
      '--audio-inventory', plan.audioInventoryPath,
      '--manifest-output', finalize.candidateManifestPath,
    ]),
  });
}

export async function runBsbAlignmentRegenerationWorkflow({
  root = process.cwd(),
  alignerDirectory,
  audioDirectory,
  workspaceDirectory,
  python = 'python3',
  commandRunner = defaultCommandRunner,
  gitResolver,
  audioInventoryResolver,
} = {}) {
  if (typeof commandRunner !== 'function') fail('A command runner is required.');

  const plan = await prepareBsbAlignmentRegeneration({
    root,
    alignerDirectory,
    audioDirectory,
    workspaceDirectory,
    ...(gitResolver ? { gitResolver } : {}),
    ...(audioInventoryResolver ? { audioInventoryResolver } : {}),
  });
  assertPlan(plan);

  const reuse = await stageReusableBsbAlignments({
    plan,
    ...(gitResolver ? { gitResolver } : {}),
  });

  const alignmentCommand = buildBsbAlignmentCommand(plan, { python });
  await commandRunner(alignmentCommand);

  const generation = await inspectBsbAlignmentRegeneration(plan);
  if (!generation.complete || generation.generatedChapters !== EXPECTED_CHAPTERS) {
    fail('BSB timing regeneration is incomplete after the aligner run.');
  }

  const audioInventory = JSON.parse(await readFile(plan.audioInventoryPath, 'utf8'));
  const finalize = buildBsbRegenerationFinalizeInputs(plan, audioInventory);
  await writeFile(finalize.metadataPath, JSON.stringify(finalize.metadata, null, 2) + '\n', { flag: 'wx' });
  await writeFile(finalize.durationsPath, JSON.stringify(finalize.durations, null, 2) + '\n', { flag: 'wx' });

  const importCommand = buildBsbAlignmentImportCommand(plan, finalize, { root });
  await commandRunner(importCommand);

  let manifest;
  try {
    manifest = JSON.parse(await readFile(finalize.candidateManifestPath, 'utf8'));
  } catch {
    fail('BSB alignment importer did not produce a readable candidate manifest.');
  }
  const manifestValidation = validateBsbAlignmentManifest(manifest, {
    requireComplete: true,
    audioContentVersion: plan.audioContentVersion,
    audioInventorySha256: plan.audioInventorySha256,
    scriptureContentVersion: plan.scriptureContentVersion,
  });
  if (!manifestValidation.valid
    || manifest.alignmentRevision !== plan.alignmentRevision
    || manifest.alignmentSource !== ALIGNMENT_SOURCE + '@' + plan.alignmentRevision
    || manifest.chapterCount !== EXPECTED_CHAPTERS) {
    fail('Generated BSB alignment manifest failed exact text/audio/revision validation: '
      + manifestValidation.issues.join('; ') + '.');
  }

  return Object.freeze({
    scriptureContentVersion: plan.scriptureContentVersion,
    audioContentVersion: plan.audioContentVersion,
    audioInventorySha256: plan.audioInventorySha256,
    alignmentRevision: plan.alignmentRevision,
    alignmentTree: plan.alignmentTree,
    reusableChapters: reuse.reusableChapters,
    regeneratedChapters: reuse.regenerateChapters,
    candidateManifestPath: finalize.candidateManifestPath,
    alignmentRowsPath: finalize.alignmentRowsPath,
    manifest,
  });
}

async function main(argv) {
  let python = 'python3';
  const args = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--python') {
      python = argv[index + 1];
      if (!python) fail('--python requires an executable name or path.');
      index += 1;
      continue;
    }
    args.push(argv[index]);
  }
  const [alignerDirectory, audioDirectory, workspaceDirectory] = args;
  if (!alignerDirectory || !audioDirectory || !workspaceDirectory || args.length !== 3) {
    fail('Usage: node scripts/v6-run-bsb-alignment-regeneration.mjs <pinned-bsb-align-dir> <staged-hays-audio-dir> <empty-workspace> [--python <python3>]');
  }
  const result = await runBsbAlignmentRegenerationWorkflow({
    alignerDirectory,
    audioDirectory,
    workspaceDirectory,
    python,
  });
  console.log(JSON.stringify({
    scriptureContentVersion: result.scriptureContentVersion,
    audioContentVersion: result.audioContentVersion,
    audioInventorySha256: result.audioInventorySha256,
    alignmentRevision: result.alignmentRevision,
    alignmentTree: result.alignmentTree,
    reusableChapters: result.reusableChapters,
    regeneratedChapters: result.regeneratedChapters,
    candidateManifestPath: result.candidateManifestPath,
    alignmentRowsPath: result.alignmentRowsPath,
  }, null, 2));
  console.error('Review the candidate timing scores and source/copy-rights evidence before placing the manifest at data/v6-audio/bsb-hays-alignment.json.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}

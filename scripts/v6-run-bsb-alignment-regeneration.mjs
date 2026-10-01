import { execFileSync } from 'node:child_process';
import { access, readFile, writeFile } from 'node:fs/promises';
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
import { snapshotStagedHaysSource, validateHaysAudioInventory } from './v6-hays-source-inventory.mjs';
import { stageReusableBsbAlignments } from './v6-stage-bsb-alignment-reuse.mjs';

const EXPECTED_CHAPTERS = 1189;
const HAYS_SOURCE = 'Barry Hays BSB narration (OpenBible direct chapter stream)';
const HAYS_LICENSE = 'CC0 1.0 public-domain dedication by the BSB Audio Bible project';
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

function defaultGitResolver(directory, args) {
  return execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8' }).trim();
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function writeExactJson(path, value, label) {
  const expected = JSON.stringify(value, null, 2) + '\n';
  if (await fileExists(path)) {
    const existing = await readFile(path, 'utf8');
    if (existing !== expected) fail(label + ' already exists with different content; resume refused.');
    return;
  }
  await writeFile(path, expected, { flag: 'wx' });
}

function assertPlan(plan) {
  if (!plan || plan.schemaVersion !== 2 || plan.translationId !== 'bsb'
    || plan.alignmentRevision !== BSB_ALIGN_REVISION || plan.alignmentTree !== BSB_ALIGN_TREE
    || plan.expectedChapters !== EXPECTED_CHAPTERS
    || !Array.isArray(plan.expectedOutputFiles) || plan.expectedOutputFiles.length !== EXPECTED_CHAPTERS
    || typeof plan.alignerDirectory !== 'string' || !plan.alignerDirectory.trim()
    || typeof plan.audioDirectory !== 'string' || !plan.audioDirectory.trim()
    || typeof plan.workspaceDirectory !== 'string' || !plan.workspaceDirectory.trim()
    || typeof plan.textDirectory !== 'string' || !plan.textDirectory.trim()
    || typeof plan.outputDirectory !== 'string' || !plan.outputDirectory.trim()
    || typeof plan.audioInventoryPath !== 'string' || !plan.audioInventoryPath.trim()
    || !/^sha256-[a-f0-9]{64}$/.test(String(plan.audioContentVersion ?? ''))
    || !/^[a-f0-9]{64}$/.test(String(plan.audioInventorySha256 ?? ''))
    || plan.audioContentVersion !== 'sha256-' + plan.audioInventorySha256) {
    fail('A reviewed exact-identity BSB regeneration plan is required.');
  }
}

export async function loadBsbRegenerationResumePlan({
  planPath,
  gitResolver = defaultGitResolver,
  audioInventoryResolver = snapshotStagedHaysSource,
} = {}) {
  if (typeof planPath !== 'string' || !planPath.trim()) fail('Resume requires a regeneration-plan.json path.');
  if (typeof gitResolver !== 'function') fail('Resume requires a Git revision resolver.');
  if (typeof audioInventoryResolver !== 'function') fail('Resume requires a Hays audio inventory resolver.');

  const resolvedPlanPath = resolve(planPath);
  let plan;
  try {
    plan = JSON.parse(await readFile(resolvedPlanPath, 'utf8'));
  } catch {
    fail('Resume regeneration plan is missing or invalid JSON.');
  }
  assertPlan(plan);
  if (resolve(plan.workspaceDirectory, 'regeneration-plan.json') !== resolvedPlanPath) {
    fail('Resume plan path does not match its immutable workspace identity.');
  }

  const revision = String(gitResolver(plan.alignerDirectory, ['rev-parse', 'HEAD']) ?? '').trim().toLowerCase();
  const tree = String(gitResolver(plan.alignerDirectory, ['rev-parse', 'HEAD^{tree}']) ?? '').trim().toLowerCase();
  const trackedChanges = String(gitResolver(plan.alignerDirectory, ['status', '--porcelain', '--untracked-files=no']) ?? '').trim();
  if (revision !== plan.alignmentRevision || revision !== BSB_ALIGN_REVISION) {
    fail('Resume refused because the bsb-align checkout revision changed.');
  }
  if (tree !== plan.alignmentTree || tree !== BSB_ALIGN_TREE) {
    fail('Resume refused because the bsb-align checkout tree changed.');
  }
  if (trackedChanges) fail('Resume refused because the bsb-align checkout has tracked modifications.');

  let textManifest;
  try {
    textManifest = JSON.parse(await readFile(join(plan.textDirectory, '_biblequest-bsb-alignment-export.json'), 'utf8'));
  } catch {
    fail('Resume refused because the prepared BibleQuest BSB text manifest is missing.');
  }
  if (textManifest.translationId !== 'bsb'
    || textManifest.scriptureContentVersion !== plan.scriptureContentVersion
    || textManifest.inventorySha256 !== plan.textInventorySha256
    || textManifest.chapters !== EXPECTED_CHAPTERS
    || !Array.isArray(textManifest.files) || textManifest.files.length !== EXPECTED_CHAPTERS) {
    fail('Resume refused because the prepared BibleQuest BSB text identity changed.');
  }

  let storedAudioInventory;
  try {
    storedAudioInventory = JSON.parse(await readFile(plan.audioInventoryPath, 'utf8'));
  } catch {
    fail('Resume refused because the exact Hays audio inventory is missing.');
  }
  const storedValidation = validateHaysAudioInventory(storedAudioInventory, { requireComplete: true });
  if (!storedValidation.valid
    || storedAudioInventory.inventorySha256 !== plan.audioInventorySha256
    || storedAudioInventory.contentVersion !== plan.audioContentVersion) {
    fail('Resume refused because the stored Hays audio inventory no longer matches the plan.');
  }

  const currentAudioInventory = await audioInventoryResolver({ audioDirectory: plan.audioDirectory });
  const currentValidation = validateHaysAudioInventory(currentAudioInventory, { requireComplete: true });
  if (!currentValidation.valid
    || currentAudioInventory.inventorySha256 !== plan.audioInventorySha256
    || currentAudioInventory.contentVersion !== plan.audioContentVersion) {
    fail('Resume refused because the staged Hays audio files changed after the plan was prepared.');
  }

  return Object.freeze({ plan, audioInventory: currentAudioInventory });
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
  resumePlanPath = null,
  python = 'python3',
  commandRunner = defaultCommandRunner,
  gitResolver,
  audioInventoryResolver,
} = {}) {
  if (typeof commandRunner !== 'function') fail('A command runner is required.');

  let plan;
  let audioInventory = null;
  let reuse = Object.freeze({ reusableChapters: null, regenerateChapters: null });
  if (resumePlanPath) {
    const resumed = await loadBsbRegenerationResumePlan({
      planPath: resumePlanPath,
      ...(gitResolver ? { gitResolver } : {}),
      ...(audioInventoryResolver ? { audioInventoryResolver } : {}),
    });
    plan = resumed.plan;
    audioInventory = resumed.audioInventory;
    try {
      const reuseReport = JSON.parse(await readFile(join(plan.workspaceDirectory, 'reuse-plan.json'), 'utf8'));
      if (reuseReport.audioInventorySha256 === plan.audioInventorySha256
        && reuseReport.scriptureContentVersion === plan.scriptureContentVersion
        && reuseReport.expectedChapters === EXPECTED_CHAPTERS) {
        reuse = Object.freeze({
          reusableChapters: Number.isSafeInteger(reuseReport.reusableChapters) ? reuseReport.reusableChapters : null,
          regenerateChapters: Number.isSafeInteger(reuseReport.regenerateChapters) ? reuseReport.regenerateChapters : null,
        });
      }
    } catch { /* Reuse statistics are optional during a valid resume. */ }
  } else {
    plan = await prepareBsbAlignmentRegeneration({
      root,
      alignerDirectory,
      audioDirectory,
      workspaceDirectory,
      ...(gitResolver ? { gitResolver } : {}),
      ...(audioInventoryResolver ? { audioInventoryResolver } : {}),
    });
    assertPlan(plan);
    reuse = await stageReusableBsbAlignments({
      plan,
      ...(gitResolver ? { gitResolver } : {}),
    });
  }

  const alignmentCommand = buildBsbAlignmentCommand(plan, { python });
  await commandRunner(alignmentCommand);

  const generation = await inspectBsbAlignmentRegeneration(plan);
  if (!generation.complete || generation.generatedChapters !== EXPECTED_CHAPTERS) {
    fail('BSB timing regeneration is incomplete after the aligner run.');
  }

  if (!audioInventory) audioInventory = JSON.parse(await readFile(plan.audioInventoryPath, 'utf8'));
  const finalize = buildBsbRegenerationFinalizeInputs(plan, audioInventory);
  await writeExactJson(finalize.metadataPath, finalize.metadata, 'Hays source metadata');
  await writeExactJson(finalize.durationsPath, finalize.durations, 'Hays duration inventory');

  const rowsExist = await fileExists(finalize.alignmentRowsPath);
  const manifestExists = await fileExists(finalize.candidateManifestPath);
  if (rowsExist !== manifestExists) {
    fail('Resume refused because final alignment outputs are incomplete; remove the partial finalization files before retrying.');
  }
  if (!manifestExists) {
    const importCommand = buildBsbAlignmentImportCommand(plan, finalize, { root });
    await commandRunner(importCommand);
  }

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
    resumed: Boolean(resumePlanPath),
    candidateManifestPath: finalize.candidateManifestPath,
    alignmentRowsPath: finalize.alignmentRowsPath,
    manifest,
  });
}

async function main(argv) {
  let python = 'python3';
  let resumePlanPath = null;
  const args = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--python') {
      python = argv[index + 1];
      if (!python) fail('--python requires an executable name or path.');
      index += 1;
      continue;
    }
    if (argv[index] === '--resume-plan') {
      resumePlanPath = argv[index + 1];
      if (!resumePlanPath) fail('--resume-plan requires regeneration-plan.json.');
      index += 1;
      continue;
    }
    args.push(argv[index]);
  }

  let result;
  if (resumePlanPath) {
    if (args.length) fail('Resume mode uses only --resume-plan <regeneration-plan.json> [--python <python3>].');
    result = await runBsbAlignmentRegenerationWorkflow({ resumePlanPath, python });
  } else {
    const [alignerDirectory, audioDirectory, workspaceDirectory] = args;
    if (!alignerDirectory || !audioDirectory || !workspaceDirectory || args.length !== 3) {
      fail('Usage: node scripts/v6-run-bsb-alignment-regeneration.mjs <pinned-bsb-align-dir> <staged-hays-audio-dir> <empty-workspace> [--python <python3>] OR --resume-plan <regeneration-plan.json> [--python <python3>]');
    }
    result = await runBsbAlignmentRegenerationWorkflow({
      alignerDirectory,
      audioDirectory,
      workspaceDirectory,
      python,
    });
  }
  console.log(JSON.stringify({
    scriptureContentVersion: result.scriptureContentVersion,
    audioContentVersion: result.audioContentVersion,
    audioInventorySha256: result.audioInventorySha256,
    alignmentRevision: result.alignmentRevision,
    alignmentTree: result.alignmentTree,
    reusableChapters: result.reusableChapters,
    regeneratedChapters: result.regeneratedChapters,
    resumed: result.resumed,
    candidateManifestPath: result.candidateManifestPath,
    alignmentRowsPath: result.alignmentRowsPath,
  }, null, 2));
  console.error('Review the candidate timing scores and source/copy-rights evidence before placing the manifest at data/v6-audio/bsb-hays-alignment.json.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}

import { execFileSync } from 'node:child_process';
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { exportCurrentBsbAlignmentText } from './v6-export-current-bsb-alignment-text.mjs';
import { snapshotStagedHaysSource, validateHaysAudioInventory } from './v6-hays-source-inventory.mjs';

export const BSB_ALIGN_REVISION = 'bdb859afc427b215b78e12ee4a7798c32b7b91e0';
export const BSB_ALIGN_TREE = 'c83b2494c8fc5413863e9617b23660eab9459323';
const EXPECTED_CHAPTERS = 1189;

function fail(message) {
  throw new Error(message);
}

async function requireDirectory(path, label) {
  let details;
  try {
    details = await stat(path);
  } catch {
    fail(label + ' does not exist: ' + path);
  }
  if (!details.isDirectory()) fail(label + ' must be a directory: ' + path);
}

function defaultGitResolver(directory, args) {
  return execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8' }).trim();
}

function expectedOutputPath(row) {
  const book = String(row.book).toUpperCase();
  return book + '/' + book + '_' + String(row.chapter).padStart(3, '0') + '_words.json';
}

export async function prepareBsbAlignmentRegeneration({
  root = process.cwd(),
  alignerDirectory,
  audioDirectory,
  workspaceDirectory,
  gitResolver = defaultGitResolver,
  audioInventoryResolver = snapshotStagedHaysSource,
} = {}) {
  if (typeof alignerDirectory !== 'string' || !alignerDirectory.trim()) fail('Pinned bsb-align directory is required.');
  if (typeof audioDirectory !== 'string' || !audioDirectory.trim()) fail('Staged Hays audio directory is required.');
  if (typeof workspaceDirectory !== 'string' || !workspaceDirectory.trim()) fail('Empty regeneration workspace is required.');
  if (typeof gitResolver !== 'function') fail('Git revision resolver is required.');
  if (typeof audioInventoryResolver !== 'function') fail('Hays audio inventory resolver is required.');

  const aligner = resolve(alignerDirectory);
  const audio = resolve(audioDirectory);
  const workspace = resolve(workspaceDirectory);
  await requireDirectory(aligner, 'Pinned bsb-align directory');
  await requireDirectory(audio, 'Staged Hays audio directory');

  const revision = String(gitResolver(aligner, ['rev-parse', 'HEAD']) ?? '').trim().toLowerCase();
  const tree = String(gitResolver(aligner, ['rev-parse', 'HEAD^{tree}']) ?? '').trim().toLowerCase();
  const trackedChanges = String(gitResolver(aligner, ['status', '--porcelain', '--untracked-files=no']) ?? '').trim();
  if (revision !== BSB_ALIGN_REVISION) fail('bsb-align checkout is not at the reviewed immutable revision.');
  if (tree !== BSB_ALIGN_TREE) fail('bsb-align checkout tree does not match the reviewed immutable tree.');
  if (trackedChanges) fail('bsb-align checkout has tracked modifications; regeneration must use the reviewed tree unchanged.');

  await mkdir(workspace, { recursive: true });
  const existing = await readdir(workspace);
  if (existing.length) fail('BSB regeneration workspace must be empty to prevent stale text or timing output.');

  const textDirectory = join(workspace, 'text');
  const outputDirectory = join(workspace, 'output');
  const textManifest = await exportCurrentBsbAlignmentText({ root, outputDirectory: textDirectory });
  await mkdir(outputDirectory, { recursive: false });
  if (textManifest.chapters !== EXPECTED_CHAPTERS || textManifest.files.length !== EXPECTED_CHAPTERS) {
    fail('Current BSB text export is not the expected 1,189-chapter corpus.');
  }

  const audioInventory = await audioInventoryResolver({ audioDirectory: audio });
  const audioValidation = validateHaysAudioInventory(audioInventory, { requireComplete: true });
  if (!audioValidation.valid) {
    fail('Staged Hays audio inventory is incomplete or invalid: ' + audioValidation.issues.join('; ') + '.');
  }
  const audioInventoryPath = join(workspace, 'audio-source-inventory.json');
  await writeFile(audioInventoryPath, JSON.stringify(audioInventory, null, 2) + '\n', { flag: 'wx' });

  const expectedOutputFiles = Object.freeze(textManifest.files.map(expectedOutputPath).sort());
  const plan = Object.freeze({
    schemaVersion: 2,
    translationId: 'bsb',
    narrator: 'Barry Hays',
    strategy: 'mms-first',
    alignmentRepository: 'BSB-publishing/bsb-align',
    alignmentRevision: BSB_ALIGN_REVISION,
    alignmentTree: BSB_ALIGN_TREE,
    scriptureContentVersion: textManifest.scriptureContentVersion,
    textInventorySha256: textManifest.inventorySha256,
    audioContentVersion: audioInventory.contentVersion,
    audioInventorySha256: audioInventory.inventorySha256,
    audioTotalBytes: audioInventory.totalBytes,
    audioTotalDurationSeconds: audioInventory.totalDurationSeconds,
    audioInventoryPath,
    expectedChapters: EXPECTED_CHAPTERS,
    alignerDirectory: aligner,
    audioDirectory: audio,
    workspaceDirectory: workspace,
    textDirectory,
    outputDirectory,
    expectedOutputFiles,
  });
  await writeFile(join(workspace, 'regeneration-plan.json'), JSON.stringify(plan, null, 2) + '\n', { flag: 'wx' });
  return plan;
}

export function buildBsbAlignmentCommand(plan, { python = 'python3' } = {}) {
  if (!plan || plan.translationId !== 'bsb' || plan.alignmentRevision !== BSB_ALIGN_REVISION
    || plan.alignmentTree !== BSB_ALIGN_TREE || plan.expectedChapters !== EXPECTED_CHAPTERS
    || !/^sha256-[a-f0-9]{64}$/.test(String(plan.audioContentVersion ?? ''))
    || !/^[a-f0-9]{64}$/.test(String(plan.audioInventorySha256 ?? ''))
    || plan.audioContentVersion !== 'sha256-' + plan.audioInventorySha256) {
    fail('A reviewed BibleQuest BSB regeneration plan is required.');
  }
  if (typeof python !== 'string' || !python.trim()) fail('Python executable is required.');
  return Object.freeze({
    executable: python.trim(),
    cwd: plan.alignerDirectory,
    args: Object.freeze([
      join(plan.alignerDirectory, 'align_book.py'),
      '--all',
      '--audio-dir', plan.audioDirectory,
      '--text-dir', plan.textDirectory,
      '--output-dir', plan.outputDirectory,
      '--force',
    ]),
  });
}

async function walkFiles(root, directory = root) {
  const rows = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) rows.push(...await walkFiles(root, path));
    else if (entry.isFile()) rows.push(relative(root, path).replaceAll('\\', '/'));
  }
  return rows;
}

export async function inspectBsbAlignmentRegeneration(plan) {
  if (!plan || !Array.isArray(plan.expectedOutputFiles) || typeof plan.outputDirectory !== 'string') {
    fail('A prepared BSB regeneration plan is required.');
  }
  const actual = new Set((await walkFiles(plan.outputDirectory)).filter(path => /_words\.json$/i.test(path)));
  const expected = new Set(plan.expectedOutputFiles);
  const missing = [...expected].filter(path => !actual.has(path)).sort();
  const unexpected = [...actual].filter(path => !expected.has(path)).sort();
  return Object.freeze({
    complete: missing.length === 0 && unexpected.length === 0 && actual.size === EXPECTED_CHAPTERS,
    expectedChapters: EXPECTED_CHAPTERS,
    generatedChapters: actual.size,
    missing: Object.freeze(missing),
    unexpected: Object.freeze(unexpected),
  });
}

async function main(argv) {
  let python = 'python3';
  const args = [];
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--python') {
      python = argv[index + 1];
      if (!python) fail('--python requires an executable name or path.');
      index += 1;
      continue;
    }
    args.push(value);
  }
  const [alignerDirectory, audioDirectory, workspaceDirectory] = args;
  if (!alignerDirectory || !audioDirectory || !workspaceDirectory || args.length !== 3) {
    fail('Usage: node scripts/v6-prepare-bsb-alignment-regeneration.mjs <pinned-bsb-align-dir> <staged-hays-audio-dir> <empty-workspace> [--python <python3>]');
  }
  const plan = await prepareBsbAlignmentRegeneration({ alignerDirectory, audioDirectory, workspaceDirectory });
  const command = buildBsbAlignmentCommand(plan, { python });
  console.log(JSON.stringify({
    scriptureContentVersion: plan.scriptureContentVersion,
    textInventorySha256: plan.textInventorySha256,
    audioContentVersion: plan.audioContentVersion,
    audioInventorySha256: plan.audioInventorySha256,
    audioTotalBytes: plan.audioTotalBytes,
    audioTotalDurationSeconds: plan.audioTotalDurationSeconds,
    alignmentRevision: plan.alignmentRevision,
    expectedChapters: plan.expectedChapters,
    command,
  }, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}

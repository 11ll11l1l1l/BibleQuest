import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { prepareBsbAlignmentRegeneration } from '../../scripts/v6-prepare-bsb-alignment-regeneration.mjs';
import {
  inspectReusableBsbWordTiming,
  stageReusableBsbAlignments,
} from '../../scripts/v6-stage-bsb-alignment-reuse.mjs';
import {
  BSB_ALIGN_REVISION,
  BSB_ALIGN_TREE,
} from '../../scripts/v6-prepare-bsb-alignment-regeneration.mjs';
import { computeHaysAudioInventoryDigest, expectedHaysAudioFiles } from '../../scripts/v6-hays-source-inventory.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));


function fakeAudioInventory() {
  const files = expectedHaysAudioFiles().map(row => ({
    ...row,
    byteLength: 1000,
    sha256: 'b'.repeat(64),
    durationSeconds: 100,
    sourceUrl: 'https://openbible.com/audio/hays/' + row.filename,
  }));
  const inventorySha256 = computeHaysAudioInventoryDigest(files);
  return {
    schemaVersion: 1,
    translationId: 'bsb',
    narrator: 'Barry Hays',
    source: 'OpenBible Barry Hays',
    sourceBaseUrl: 'https://openbible.com/audio/hays/',
    chapters: 1189,
    totalBytes: 1189000,
    totalDurationSeconds: 118900,
    inventorySha256,
    contentVersion: 'sha256-' + inventorySha256,
    files,
  };
}

function reviewedGit(_directory: string, args: readonly string[]) {
  if (args[0] === 'rev-parse' && args[1] === 'HEAD') return BSB_ALIGN_REVISION;
  if (args[0] === 'rev-parse' && args[1] === 'HEAD^{tree}') return BSB_ALIGN_TREE;
  if (args[0] === 'status') return '';
  throw new Error('Unexpected git query');
}

function wordOutputFor(text: string, book = 'GEN', chapter = 1) {
  let cursor = 0.1;
  const verses: Record<string, Array<{ text: string; start: number; end: number; score: number }>> = {};
  const lines = text.replace(/\r/g, '').trimEnd().split('\n');
  lines.forEach((line, index) => {
    verses[String(index + 1)] = line.split(/\s+/).filter(Boolean).map(word => {
      const start = cursor;
      const end = start + 0.05;
      cursor = end + 0.01;
      return { text: word, start, end, score: 0.9 };
    });
  });
  return { book, chapter: String(chapter).padStart(3, '0'), verses };
}

test('reuse inspector accepts token-identical text/timing and rejects drift or invalid timing', () => {
  const currentText = 'In the beginning, God created.\nThe earth was formless.\n';
  const valid = wordOutputFor(currentText);
  const result = inspectReusableBsbWordTiming({
    currentText,
    upstreamText: 'In the beginning God created\nThe earth was formless\n',
    wordOutput: valid,
    book: 'GEN',
    chapter: 1,
  });
  assert.equal(result.reusable, true);

  const drifted = inspectReusableBsbWordTiming({
    currentText,
    upstreamText: 'In a beginning God created\nThe earth was formless\n',
    wordOutput: valid,
    book: 'GEN',
    chapter: 1,
  });
  assert.equal(drifted.reusable, false);
  assert.ok(drifted.reasons.includes('text-token-mismatch'));

  const badTiming = structuredClone(valid);
  badTiming.verses['1'][0].end = badTiming.verses['1'][0].start;
  const invalid = inspectReusableBsbWordTiming({
    currentText,
    upstreamText: currentText,
    wordOutput: badTiming,
    book: 'GEN',
    chapter: 1,
  });
  assert.equal(invalid.reusable, false);
  assert.ok(invalid.reasons.includes('word-output-invalid-timing'));
});

test('reuse staging preserves matching upstream chapters and leaves only mismatches for regeneration', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'bq-v6-bsb-reuse-'));
  const aligner = join(temp, 'bsb-align');
  const audio = join(temp, 'audio');
  const workspace = join(temp, 'workspace');
  await mkdir(join(aligner, 'text'), { recursive: true });
  await mkdir(join(aligner, 'output'), { recursive: true });
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
    const currentText = await readFile(join(plan.textDirectory, 'GEN_001_BSB.txt'), 'utf8');
    await writeFile(join(aligner, 'text', 'GEN_001_BSB.txt'), currentText);
    const upstreamWordPath = join(aligner, 'output', 'GEN', 'GEN_001_words.json');
    await mkdir(dirname(upstreamWordPath), { recursive: true });
    await writeFile(upstreamWordPath, JSON.stringify(wordOutputFor(currentText), null, 2));

    const report = await stageReusableBsbAlignments({ plan, gitResolver: reviewedGit });
    assert.equal(report.reusableChapters, 1);
    assert.equal(report.regenerateChapters, 1188);
    assert.equal(report.expectedChapters, 1189);
    assert.equal(report.rows.find(row => row.book === 'GEN' && row.chapter === 1)?.reusable, true);

    const staged = JSON.parse(await readFile(join(plan.outputDirectory, 'GEN', 'GEN_001_words.json'), 'utf8'));
    assert.equal(staged.book, 'GEN');
    assert.equal(staged.chapter, '001');

    const disk = JSON.parse(await readFile(join(plan.workspaceDirectory, 'reuse-plan.json'), 'utf8'));
    assert.equal(disk.reusableChapters, 1);
    assert.equal(disk.regenerateChapters, 1188);

    await assert.rejects(stageReusableBsbAlignments({ plan, gitResolver: reviewedGit }), /requires an empty regeneration output directory/i);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

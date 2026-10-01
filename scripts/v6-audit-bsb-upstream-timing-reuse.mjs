import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BSB_ALIGN_REVISION,
  BSB_ALIGN_TREE,
} from './v6-prepare-bsb-alignment-regeneration.mjs';
import { exportCurrentBsbAlignmentText } from './v6-export-current-bsb-alignment-text.mjs';
import { inspectReusableBsbWordTiming } from './v6-stage-bsb-alignment-reuse.mjs';

const EXPECTED_CHAPTERS = 1189;

function fail(message) {
  throw new Error(message);
}

function defaultGitResolver(directory, args) {
  return execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8' }).trim();
}

function outputPathFor(row) {
  const book = String(row.book).toUpperCase();
  return join(book, book + '_' + String(row.chapter).padStart(3, '0') + '_words.json');
}

function reasonCounts(rows) {
  const counts = {};
  for (const row of rows) {
    for (const reason of row.reasons) counts[reason] = (counts[reason] || 0) + 1;
  }
  return Object.freeze(counts);
}

export async function auditBsbUpstreamTimingReuse({
  root = process.cwd(),
  alignerDirectory,
  gitResolver = defaultGitResolver,
} = {}) {
  if (typeof alignerDirectory !== 'string' || !alignerDirectory.trim()) {
    fail('Pinned bsb-align directory is required for the reuse audit.');
  }
  if (typeof gitResolver !== 'function') fail('Git revision resolver is required.');

  const aligner = resolve(alignerDirectory);
  const revision = String(gitResolver(aligner, ['rev-parse', 'HEAD']) ?? '').trim().toLowerCase();
  const tree = String(gitResolver(aligner, ['rev-parse', 'HEAD^{tree}']) ?? '').trim().toLowerCase();
  const trackedChanges = String(gitResolver(aligner, ['status', '--porcelain', '--untracked-files=no']) ?? '').trim();
  if (revision !== BSB_ALIGN_REVISION) fail('bsb-align checkout is not at the reviewed immutable revision.');
  if (tree !== BSB_ALIGN_TREE) fail('bsb-align checkout tree does not match the reviewed immutable tree.');
  if (trackedChanges) fail('bsb-align checkout has tracked modifications; reuse audit refused.');

  const temp = await mkdtemp(join(tmpdir(), 'bq-v6-bsb-reuse-audit-'));
  try {
    const textManifest = await exportCurrentBsbAlignmentText({ root, outputDirectory: temp });
    if (textManifest.chapters !== EXPECTED_CHAPTERS || textManifest.files.length !== EXPECTED_CHAPTERS) {
      fail('Current BibleQuest BSB text export is not the canonical 1,189-chapter corpus.');
    }

    const rows = [];
    let reusableChapters = 0;
    let lowConfidenceWords = 0;
    let unscoredWords = 0;

    for (const row of textManifest.files) {
      const currentText = await readFile(join(temp, row.filename), 'utf8');
      const upstreamTextPath = join(aligner, 'text', row.filename);
      const upstreamWordPath = join(aligner, 'output', outputPathFor(row));

      let upstreamText;
      let wordOutput;
      try {
        upstreamText = await readFile(upstreamTextPath, 'utf8');
      } catch {
        rows.push(Object.freeze({
          book: row.book,
          chapter: row.chapter,
          reusable: false,
          reasons: Object.freeze(['upstream-text-missing']),
          lowConfidenceWords: 0,
          unscoredWords: 0,
        }));
        continue;
      }
      try {
        wordOutput = JSON.parse(await readFile(upstreamWordPath, 'utf8'));
      } catch {
        rows.push(Object.freeze({
          book: row.book,
          chapter: row.chapter,
          reusable: false,
          reasons: Object.freeze(['upstream-word-output-missing-or-invalid']),
          lowConfidenceWords: 0,
          unscoredWords: 0,
        }));
        continue;
      }

      const inspection = inspectReusableBsbWordTiming({
        currentText,
        upstreamText,
        wordOutput,
        book: row.book,
        chapter: row.chapter,
      });
      rows.push(Object.freeze({
        book: row.book,
        chapter: row.chapter,
        reusable: inspection.reusable,
        reasons: inspection.reasons,
        lowConfidenceWords: inspection.lowConfidenceWords,
        unscoredWords: inspection.unscoredWords,
      }));
      if (inspection.reusable) reusableChapters += 1;
      lowConfidenceWords += inspection.lowConfidenceWords;
      unscoredWords += inspection.unscoredWords;
    }

    return Object.freeze({
      schemaVersion: 1,
      translationId: 'bsb',
      scriptureContentVersion: textManifest.scriptureContentVersion,
      textInventorySha256: textManifest.inventorySha256,
      alignmentRevision: BSB_ALIGN_REVISION,
      alignmentTree: BSB_ALIGN_TREE,
      expectedChapters: EXPECTED_CHAPTERS,
      reusableChapters,
      regenerateChapters: EXPECTED_CHAPTERS - reusableChapters,
      lowConfidenceWords,
      unscoredWords,
      reasonCounts: reasonCounts(rows),
      rows: Object.freeze(rows),
    });
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

async function main(argv) {
  const [alignerDirectory, reportPath] = argv;
  if (!alignerDirectory || argv.length > 2) {
    fail('Usage: node scripts/v6-audit-bsb-upstream-timing-reuse.mjs <pinned-bsb-align-dir> [report.json]');
  }
  const report = await auditBsbUpstreamTimingReuse({ alignerDirectory });
  const summary = {
    scriptureContentVersion: report.scriptureContentVersion,
    textInventorySha256: report.textInventorySha256,
    alignmentRevision: report.alignmentRevision,
    alignmentTree: report.alignmentTree,
    expectedChapters: report.expectedChapters,
    reusableChapters: report.reusableChapters,
    regenerateChapters: report.regenerateChapters,
    lowConfidenceWords: report.lowConfidenceWords,
    unscoredWords: report.unscoredWords,
    reasonCounts: report.reasonCounts,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (reportPath) {
    await writeFile(resolve(reportPath), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
    console.error('Wrote full BSB reuse audit to ' + resolve(reportPath) + '.');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}

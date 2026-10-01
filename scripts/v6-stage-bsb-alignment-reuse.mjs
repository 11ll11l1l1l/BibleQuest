import { execFileSync } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { BSB_ALIGN_REVISION, BSB_ALIGN_TREE } from './v6-prepare-bsb-alignment-regeneration.mjs';
import { validateHaysAudioInventory } from './v6-hays-source-inventory.mjs';

const WORD_OUTPUT = /^((?:[1-3])?[A-Z]{2,3})\/\1_(\d{3})_words\.json$/;
const EXPECTED_CHAPTERS = 1189;

function defaultGitResolver(directory, args) {
  return execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8' }).trim();
}

function fail(message) {
  throw new Error(message);
}

function tokens(value) {
  return String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}_\s]/gu, '').toLowerCase().trim().split(/\s+/u).filter(Boolean);
}

function lines(value) {
  const rows = String(value ?? '').replace(/\r/g, '').split('\n');
  while (rows.length && rows.at(-1) === '') rows.pop();
  return rows;
}

function sameTokens(left, right) {
  const a = tokens(left), b = tokens(right);
  return a.length === b.length && a.every((token, index) => token === b[index]);
}

export function inspectBsbTextCompatibility({ currentText, upstreamText }) {
  const reasons = [];
  const currentLines = lines(currentText);
  const upstreamLines = lines(upstreamText);

  if (!currentLines.length) reasons.push('current-text-empty');
  if (upstreamLines.length !== currentLines.length) reasons.push('text-line-count-mismatch');
  const lineCount = Math.min(currentLines.length, upstreamLines.length);
  for (let index = 0; index < lineCount; index += 1) {
    if (!sameTokens(currentLines[index], upstreamLines[index])) {
      reasons.push('text-token-mismatch');
      break;
    }
  }
  const uniqueReasons = [...new Set(reasons)];
  return Object.freeze({
    compatible: uniqueReasons.length === 0,
    reasons: Object.freeze(uniqueReasons),
  });
}

export function inspectReusableBsbWordTiming({ currentText, upstreamText, wordOutput, book, chapter }) {
  const code = String(book ?? '').toUpperCase();
  const number = Number(chapter);
  const currentLines = lines(currentText);
  const textCompatibility = inspectBsbTextCompatibility({ currentText, upstreamText });
  const reasons = [...textCompatibility.reasons];

  if (!wordOutput || typeof wordOutput !== 'object' || String(wordOutput.book ?? '').toUpperCase() !== code
    || Number(wordOutput.chapter) !== number || !wordOutput.verses || typeof wordOutput.verses !== 'object'
    || Array.isArray(wordOutput.verses)) {
    reasons.push('word-output-identity-mismatch');
    return Object.freeze({ reusable: false, reasons: Object.freeze([...new Set(reasons)]), lowConfidenceWords: 0, unscoredWords: 0 });
  }

  const verseKeys = Object.keys(wordOutput.verses).map(Number).sort((a, b) => a - b);
  if (verseKeys.length !== currentLines.length || verseKeys.some((verse, index) => verse !== index + 1)) {
    reasons.push('word-output-verse-map-mismatch');
  }

  let previousEnd = -Infinity;
  let lowConfidenceWords = 0;
  let unscoredWords = 0;
  for (let index = 0; index < currentLines.length; index += 1) {
    const verse = index + 1;
    const words = wordOutput.verses?.[String(verse)];
    if (!Array.isArray(words) || words.length === 0) {
      reasons.push('word-output-missing-verse');
      continue;
    }
    const timingTokens = [];
    for (const word of words) {
      if (typeof word?.text !== 'string' || !Number.isFinite(word.start) || !Number.isFinite(word.end)
        || word.start < 0 || word.end <= word.start || word.start < previousEnd) {
        reasons.push('word-output-invalid-timing');
        break;
      }
      timingTokens.push(...tokens(word.text));
      previousEnd = word.end;
      if (Number.isFinite(word.score) && word.score >= 0 && word.score <= 1) {
        if (word.score < 0.3) lowConfidenceWords += 1;
      } else {
        unscoredWords += 1;
      }
    }
    const expectedTokens = tokens(currentLines[index]);
    if (timingTokens.length !== expectedTokens.length
      || timingTokens.some((token, tokenIndex) => token !== expectedTokens[tokenIndex])) {
      reasons.push('word-output-text-mismatch');
    }
  }

  const uniqueReasons = [...new Set(reasons)];
  return Object.freeze({
    reusable: uniqueReasons.length === 0,
    reasons: Object.freeze(uniqueReasons),
    lowConfidenceWords,
    unscoredWords,
  });
}

function parseExpectedOutput(relativePath) {
  const match = WORD_OUTPUT.exec(relativePath);
  if (!match) fail('Regeneration plan contains an invalid expected output path: ' + relativePath);
  return Object.freeze({
    book: match[1],
    chapter: Number(match[2]),
    textFilename: match[1] + '_' + match[2] + '_BSB.txt',
  });
}

export async function stageReusableBsbAlignments({
  plan,
  writeReport = true,
  gitResolver = defaultGitResolver,
} = {}) {
  if (!plan || plan.schemaVersion !== 2 || plan.translationId !== 'bsb' || plan.alignmentRevision !== BSB_ALIGN_REVISION
    || plan.alignmentTree !== BSB_ALIGN_TREE || plan.expectedChapters !== EXPECTED_CHAPTERS
    || !Array.isArray(plan.expectedOutputFiles) || plan.expectedOutputFiles.length !== EXPECTED_CHAPTERS
    || !/^sha256-[a-f0-9]{64}$/.test(String(plan.audioContentVersion ?? ''))
    || !/^[a-f0-9]{64}$/.test(String(plan.audioInventorySha256 ?? ''))
    || plan.audioContentVersion !== 'sha256-' + plan.audioInventorySha256
    || typeof plan.audioInventoryPath !== 'string' || !plan.audioInventoryPath.trim()) {
    fail('A reviewed 1,189-chapter BibleQuest BSB regeneration plan with exact Hays audio identity is required.');
  }

  if (typeof gitResolver !== 'function') fail('Git revision resolver is required.');
  let audioInventory;
  try {
    audioInventory = JSON.parse(await readFile(resolve(plan.audioInventoryPath), 'utf8'));
  } catch {
    fail('Exact Hays audio inventory referenced by the regeneration plan is missing or invalid.');
  }
  const audioValidation = validateHaysAudioInventory(audioInventory, { requireComplete: true });
  if (!audioValidation.valid
    || audioInventory.contentVersion !== plan.audioContentVersion
    || audioInventory.inventorySha256 !== plan.audioInventorySha256) {
    fail('Exact Hays audio inventory does not match the regeneration plan.');
  }
  const liveRevision = String(gitResolver(plan.alignerDirectory, ['rev-parse', 'HEAD']) ?? '').trim().toLowerCase();
  const liveTree = String(gitResolver(plan.alignerDirectory, ['rev-parse', 'HEAD^{tree}']) ?? '').trim().toLowerCase();
  const trackedChanges = String(gitResolver(plan.alignerDirectory, ['status', '--porcelain', '--untracked-files=no']) ?? '').trim();
  if (liveRevision !== plan.alignmentRevision || liveRevision !== BSB_ALIGN_REVISION) {
    fail('bsb-align checkout moved after the regeneration plan was prepared.');
  }
  if (liveTree !== plan.alignmentTree || liveTree !== BSB_ALIGN_TREE) {
    fail('bsb-align checkout tree changed after the regeneration plan was prepared.');
  }
  if (trackedChanges) fail('bsb-align checkout has tracked modifications; reuse staging is refused.');

  const outputDirectory = resolve(plan.outputDirectory);
  const existing = await readdir(outputDirectory);
  if (existing.length) fail('BSB reuse staging requires an empty regeneration output directory.');

  const rows = [];
  let reusableChapters = 0;
  let lowConfidenceWords = 0;
  let unscoredWords = 0;

  for (const relativePath of plan.expectedOutputFiles) {
    const parsed = parseExpectedOutput(relativePath);
    const currentTextPath = join(plan.textDirectory, parsed.textFilename);
    const upstreamTextPath = join(plan.alignerDirectory, 'text', parsed.textFilename);
    const upstreamWordPath = join(plan.alignerDirectory, 'output', relativePath);

    let currentText, upstreamText, wordOutput;
    try {
      currentText = await readFile(currentTextPath, 'utf8');
    } catch {
      fail('Prepared Reader text is missing: ' + currentTextPath);
    }
    try {
      upstreamText = await readFile(upstreamTextPath, 'utf8');
    } catch {
      rows.push(Object.freeze({ book: parsed.book, chapter: parsed.chapter, reusable: false, reasons: Object.freeze(['upstream-text-missing']) }));
      continue;
    }
    const textCompatibility = inspectBsbTextCompatibility({ currentText, upstreamText });
    if (!textCompatibility.compatible) {
      rows.push(Object.freeze({
        book: parsed.book,
        chapter: parsed.chapter,
        reusable: false,
        reasons: textCompatibility.reasons,
        lowConfidenceWords: 0,
        unscoredWords: 0,
      }));
      continue;
    }
    try {
      wordOutput = JSON.parse(await readFile(upstreamWordPath, 'utf8'));
    } catch {
      rows.push(Object.freeze({ book: parsed.book, chapter: parsed.chapter, reusable: false, reasons: Object.freeze(['upstream-word-output-missing-or-invalid']) }));
      continue;
    }

    const inspection = inspectReusableBsbWordTiming({
      currentText,
      upstreamText,
      wordOutput,
      book: parsed.book,
      chapter: parsed.chapter,
    });
    rows.push(Object.freeze({
      book: parsed.book,
      chapter: parsed.chapter,
      reusable: inspection.reusable,
      reasons: inspection.reasons,
      lowConfidenceWords: inspection.lowConfidenceWords,
      unscoredWords: inspection.unscoredWords,
    }));
    if (!inspection.reusable) continue;

    const target = join(outputDirectory, relativePath);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(upstreamWordPath, target, fsConstants.COPYFILE_EXCL);
    reusableChapters += 1;
    lowConfidenceWords += inspection.lowConfidenceWords;
    unscoredWords += inspection.unscoredWords;
  }

  const regenerate = rows.filter(row => !row.reusable);
  const report = Object.freeze({
    schemaVersion: 1,
    translationId: 'bsb',
    scriptureContentVersion: plan.scriptureContentVersion,
    audioContentVersion: plan.audioContentVersion,
    audioInventorySha256: plan.audioInventorySha256,
    alignmentRevision: plan.alignmentRevision,
    alignmentTree: plan.alignmentTree,
    expectedChapters: EXPECTED_CHAPTERS,
    reusableChapters,
    regenerateChapters: regenerate.length,
    lowConfidenceWords,
    unscoredWords,
    regenerate: Object.freeze(regenerate),
    rows: Object.freeze(rows),
  });
  if (writeReport) {
    await writeFile(join(plan.workspaceDirectory, 'reuse-plan.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  }
  return report;
}


async function main(argv) {
  const [planPath] = argv;
  if (!planPath || argv.length !== 1) {
    fail('Usage: node scripts/v6-stage-bsb-alignment-reuse.mjs <regeneration-plan.json>');
  }
  const plan = JSON.parse(await readFile(resolve(planPath), 'utf8'));
  const report = await stageReusableBsbAlignments({ plan });
  console.log(JSON.stringify({
    scriptureContentVersion: report.scriptureContentVersion,
    audioContentVersion: report.audioContentVersion,
    audioInventorySha256: report.audioInventorySha256,
    alignmentRevision: report.alignmentRevision,
    expectedChapters: report.expectedChapters,
    reusableChapters: report.reusableChapters,
    regenerateChapters: report.regenerateChapters,
    lowConfidenceWords: report.lowConfidenceWords,
    unscoredWords: report.unscoredWords,
  }, null, 2));
  if (report.regenerateChapters > 0) {
    console.error('Regenerate the remaining ' + report.regenerateChapters + ' chapters with the prepared align_book.py command.');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}

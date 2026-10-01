import { readFile, readdir } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BOOK_FILE = /^(?:[1-3])?[A-Z]{2,3}\.json$/;

export function alignmentTokens(value) {
  return String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}_\s]/gu, '').toLowerCase().trim().split(/\s+/u).filter(Boolean);
}

export function auditBsbAlignmentChapter({ book, chapter, currentVerses, alignmentText }) {
  const code = String(book ?? '').trim().toUpperCase();
  const chapterNumber = Number(chapter);
  if (!BOOK_FILE.test(`${code}.json`) || !Number.isSafeInteger(chapterNumber) || chapterNumber < 1) {
    throw new Error('Alignment audit requires a valid Bible book/chapter identity.');
  }
  if (!Array.isArray(currentVerses) || !currentVerses.length) {
    throw new Error(`Current BSB ${code} ${chapterNumber} has no verses.`);
  }

  const sourceLines = String(alignmentText ?? '').replace(/\r/g, '').split('\n');
  while (sourceLines.length && sourceLines.at(-1) === '') sourceLines.pop();
  const ordered = [...currentVerses].sort((a, b) => Number(a.v) - Number(b.v));
  const mismatches = [];

  if (sourceLines.length !== ordered.length) {
    mismatches.push(Object.freeze({
      book: code,
      chapter: chapterNumber,
      verse: 0,
      reason: 'verse-count-mismatch',
      current: String(ordered.length),
      alignment: String(sourceLines.length),
    }));
  }

  let matchingVerseLines = 0;
  ordered.forEach((row, ordinalIndex) => {
    const verse = Number(row?.v);
    if (!Number.isSafeInteger(verse) || verse < 1 || typeof row?.t !== 'string') {
      throw new Error(`Current BSB ${code} ${chapterNumber} contains a malformed verse row.`);
    }
    // bsb-align emits one timing/text line per present source verse. Its verse keys
    // are line ordinals, not canonical verse numbers. Canonical Bibles can omit
    // verse numbers (for example Acts 8:37), so index by sorted row ordinal here.
    const source = sourceLines[ordinalIndex] ?? '';
    const currentTokens = alignmentTokens(row.t);
    const sourceTokens = alignmentTokens(source);
    if (currentTokens.length !== sourceTokens.length || currentTokens.some((token, index) => token !== sourceTokens[index])) {
      mismatches.push(Object.freeze({
        book: code,
        chapter: chapterNumber,
        verse,
        sourceLine: ordinalIndex + 1,
        reason: 'text-mismatch',
        current: row.t,
        alignment: source,
      }));
    } else {
      matchingVerseLines += 1;
    }
  });

  return Object.freeze({
    valid: mismatches.length === 0,
    book: code,
    chapter: chapterNumber,
    verses: ordered.length,
    matchingVerseLines,
    mismatchedVerseLines: ordered.length - matchingVerseLines,
    mismatches: Object.freeze(mismatches),
  });
}

export async function auditBsbAlignmentTextSource({
  root = process.cwd(),
  alignmentTextDir,
} = {}) {
  if (typeof alignmentTextDir !== 'string' || !alignmentTextDir.trim()) {
    throw new Error('Alignment audit requires the pinned bsb-align text directory.');
  }

  const packDir = resolve(root, 'data', 'packs', 'bible');
  const sourceDir = resolve(alignmentTextDir);
  const packFiles = (await readdir(packDir)).filter(name => BOOK_FILE.test(name)).sort();
  if (packFiles.length !== 66) throw new Error(`Expected 66 BSB book packs, found ${packFiles.length}.`);

  let chapters = 0;
  let verses = 0;
  let matchingChapters = 0;
  let matchingVerseLines = 0;
  const mismatches = [];
  const missingFiles = [];

  for (const file of packFiles) {
    const book = basename(file, '.json').toUpperCase();
    const rows = JSON.parse(await readFile(join(packDir, file), 'utf8'));
    if (!Array.isArray(rows)) throw new Error(`BSB pack ${book} must be an array.`);
    const byChapter = new Map();
    for (const row of rows) {
      if (!byChapter.has(row.c)) byChapter.set(row.c, []);
      byChapter.get(row.c).push(row);
    }

    for (const [chapter, currentVerses] of [...byChapter.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
      chapters += 1;
      verses += currentVerses.length;
      const path = join(sourceDir, `${book}_${String(chapter).padStart(3, '0')}_BSB.txt`);
      let alignmentText = '';
      try {
        alignmentText = await readFile(path, 'utf8');
      } catch {
        missingFiles.push(path);
        continue;
      }
      const result = auditBsbAlignmentChapter({ book, chapter, currentVerses, alignmentText });
      if (result.valid) matchingChapters += 1;
      matchingVerseLines += result.matchingVerseLines;
      mismatches.push(...result.mismatches);
    }
  }

  return Object.freeze({
    valid: missingFiles.length === 0 && mismatches.length === 0,
    books: packFiles.length,
    chapters,
    verses,
    matchingChapters,
    mismatchedChapters: chapters - matchingChapters,
    matchingVerseLines,
    mismatchedVerseLines: verses - matchingVerseLines,
    missingFiles: Object.freeze(missingFiles),
    mismatches: Object.freeze(mismatches),
  });
}

async function main(argv) {
  const alignmentTextDir = argv[0];
  if (!alignmentTextDir) {
    throw new Error('Usage: node scripts/v6-audit-bsb-alignment-source.mjs <pinned-bsb-align-text-dir>');
  }
  const result = await auditBsbAlignmentTextSource({ alignmentTextDir });
  console.log(JSON.stringify({
    valid: result.valid,
    books: result.books,
    chapters: result.chapters,
    verses: result.verses,
    matchingChapters: result.matchingChapters,
    mismatchedChapters: result.mismatchedChapters,
    matchingVerseLines: result.matchingVerseLines,
    mismatchedVerseLines: result.mismatchedVerseLines,
    missingFiles: result.missingFiles.length,
    textMismatches: result.mismatches.length,
  }, null, 2));
  for (const row of result.mismatches.slice(0, 25)) {
    console.error(`${row.book} ${row.chapter}:${row.verse} ${row.reason}\n  current: ${row.current}\n  aligned: ${row.alignment}`);
  }
  if (result.missingFiles.length) {
    console.error(`Missing alignment text files (first 25):\n${result.missingFiles.slice(0, 25).join('\n')}`);
  }
  if (!result.valid) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}

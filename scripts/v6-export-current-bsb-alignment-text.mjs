import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SCRIPTURE_PACKAGE_SOURCES, buildScripturePackageManifest } from './v6-generate-scripture-manifests.mjs';

const BOOK_FILE = /^(?:[1-3])?[A-Z]{2,3}\.json$/;
const EXPECTED_BOOKS = 66;
const EXPECTED_CHAPTERS = 1189;
const sha256 = value => createHash('sha256').update(value).digest('hex');

function fail(message) {
  throw new Error(message);
}

export async function exportCurrentBsbAlignmentText({
  root = process.cwd(),
  outputDirectory,
} = {}) {
  if (typeof outputDirectory !== 'string' || !outputDirectory.trim()) {
    fail('BSB alignment export requires an output directory.');
  }
  const output = resolve(outputDirectory);
  await mkdir(output, { recursive: true });
  const existing = await readdir(output);
  if (existing.length) fail('BSB alignment export directory must be empty to prevent stale timing inputs.');

  const bsb = SCRIPTURE_PACKAGE_SOURCES.find(source => source.translationId === 'bsb');
  if (!bsb) fail('BSB Scripture package source is not configured.');
  const scriptureManifest = buildScripturePackageManifest(root, bsb);
  const packDirectory = resolve(root, 'data', 'packs', bsb.folder);
  const packFiles = (await readdir(packDirectory)).filter(name => BOOK_FILE.test(name)).sort();
  if (packFiles.length !== EXPECTED_BOOKS) fail(`Expected ${EXPECTED_BOOKS} BSB book packs, found ${packFiles.length}.`);

  const files = [];
  let chapterCount = 0;
  let verseCount = 0;

  for (const file of packFiles) {
    const book = basename(file, '.json').toUpperCase();
    const rows = JSON.parse(await readFile(join(packDirectory, file), 'utf8'));
    if (!Array.isArray(rows) || !rows.length) fail(`BSB pack ${book} must contain verse rows.`);
    const chapters = new Map();

    for (const row of rows) {
      if (!Number.isSafeInteger(row?.c) || row.c < 1 || !Number.isSafeInteger(row?.v) || row.v < 1 || typeof row.t !== 'string') {
        fail(`BSB pack ${book} contains a malformed verse row.`);
      }
      if (/\r|\n/.test(row.t)) fail(`BSB ${book} ${row.c}:${row.v} contains an embedded newline.`);
      const chapter = chapters.get(row.c) ?? [];
      chapter.push(row);
      chapters.set(row.c, chapter);
    }

    for (const [chapter, verseRows] of [...chapters.entries()].sort((a, b) => a[0] - b[0])) {
      verseRows.sort((a, b) => a.v - b.v);
      verseRows.forEach((row, index) => {
        if (index > 0 && row.v <= verseRows[index - 1].v) {
          fail(`BSB ${book} ${chapter} has a duplicate or unordered verse ${row.v}.`);
        }
      });
      const verseNumbers = verseRows.map(row => row.v);
      const filename = `${book}_${String(chapter).padStart(3, '0')}_BSB.txt`;
      const content = `${verseRows.map(row => row.t).join('\n')}\n`;
      await writeFile(join(output, filename), content, { flag: 'wx' });
      files.push(Object.freeze({
        book,
        chapter,
        filename,
        verses: verseRows.length,
        verseNumbers: Object.freeze(verseNumbers),
        requiresVerseRemap: verseNumbers.some((verse, index) => verse !== index + 1),
        sha256: sha256(content),
      }));
      chapterCount += 1;
      verseCount += verseRows.length;
    }
  }

  if (chapterCount !== EXPECTED_CHAPTERS) fail(`Expected ${EXPECTED_CHAPTERS} BSB chapters, found ${chapterCount}.`);
  const inventorySeed = files.map(row => `${row.filename}:${row.sha256}:${row.verses}:${row.verseNumbers.join(',')}`).join('\n');
  const exportManifest = Object.freeze({
    schemaVersion: 1,
    translationId: 'bsb',
    scriptureContentVersion: scriptureManifest.contentVersion,
    books: packFiles.length,
    chapters: chapterCount,
    verses: verseCount,
    inventorySha256: sha256(inventorySeed),
    files: Object.freeze(files),
  });
  await writeFile(
    join(output, '_biblequest-bsb-alignment-export.json'),
    `${JSON.stringify(exportManifest, null, 2)}\n`,
    { flag: 'wx' },
  );
  return exportManifest;
}

async function main(argv) {
  const [outputDirectory] = argv;
  if (!outputDirectory) {
    fail('Usage: node scripts/v6-export-current-bsb-alignment-text.mjs <empty-output-directory>');
  }
  const manifest = await exportCurrentBsbAlignmentText({ outputDirectory });
  console.log(
    `Exported ${manifest.books} BSB books / ${manifest.chapters} chapters / ${manifest.verses} verses for ${manifest.scriptureContentVersion}; inventory ${manifest.inventorySha256}.`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}

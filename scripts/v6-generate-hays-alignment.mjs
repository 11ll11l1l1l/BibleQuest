import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SCRIPTURE_PACKAGE_SOURCES, buildScripturePackageManifest } from './v6-generate-scripture-manifests.mjs';

export const HAYS_ALIGNMENT_REPOSITORY = 'BSB-publishing/bsb-align';
export const HAYS_AUDIO_CONTENT_VERSION = 'openbible-hays-stream-v1';
export const HAYS_AUDIO_SOURCE = 'Barry Hays BSB narration (OpenBible direct chapter stream)';
export const HAYS_AUDIO_LICENSE = 'CC0 1.0 declared by the BSB Audio Bible project; exact files remain subject to review';
export const EXPECTED_BSB_BOOKS = 66;
export const EXPECTED_BSB_CHAPTERS = 1189;
export const EXPECTED_BSB_VERSES = 31086;

const REVISION = /^[a-f0-9]{40}$/i;
const BOOK_FILE = /^(?:[1-3])?[A-Z]{2,3}\.json$/;
const ALIGNMENT_FILE = /^((?:[1-3])?[A-Z]{2,3})_(\d{3})_words\.json$/;
const sha256 = value => createHash('sha256').update(value).digest('hex');

function parseArgs(argv) {
  const args = { root: process.cwd(), alignmentRoot: '', revision: '', output: '' };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === '--root') args.root = argv[++i];
    else if (value === '--alignment-root') args.alignmentRoot = argv[++i];
    else if (value === '--revision') args.revision = argv[++i];
    else if (value === '--output') args.output = argv[++i];
    else if (value === '--help') args.help = true;
    else throw new Error(`Unknown argument: ${value}`);
  }
  return args;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function canonicalBible(root) {
  const source = SCRIPTURE_PACKAGE_SOURCES.find(row => row.translationId === 'bsb');
  if (!source) throw new Error('BSB Scripture source is missing from the V6 manifest generator.');
  const scriptureManifest = buildScripturePackageManifest(root, source);
  const directory = resolve(root, 'data', 'packs', source.folder);
  const files = readdirSync(directory).filter(name => BOOK_FILE.test(name)).sort();
  if (files.length !== EXPECTED_BSB_BOOKS) {
    throw new Error(`Expected ${EXPECTED_BSB_BOOKS} BSB books, found ${files.length}.`);
  }
  const books = files.map(name => {
    const code = basename(name, '.json').toUpperCase();
    const rows = readJson(join(directory, name));
    if (!Array.isArray(rows) || rows.length === 0) throw new Error(`${code} has no Scripture rows.`);
    const chapters = new Map();
    for (const row of rows) {
      const chapter = Number(row?.c), verse = Number(row?.v);
      if (!Number.isSafeInteger(chapter) || chapter < 1 || !Number.isSafeInteger(verse) || verse < 1) {
        throw new Error(`${code} has invalid chapter/verse identity.`);
      }
      if (!chapters.has(chapter)) chapters.set(chapter, []);
      chapters.get(chapter).push(verse);
    }
    const maxChapter = Math.max(...chapters.keys());
    for (let chapter = 1; chapter <= maxChapter; chapter += 1) {
      const verses = chapters.get(chapter);
      if (!verses?.length) throw new Error(`${code} ${chapter} is missing from the canonical BSB pack.`);
      verses.sort((a, b) => a - b);
      for (let index = 0; index < verses.length; index += 1) {
        if (!Number.isSafeInteger(verses[index]) || verses[index] < 1
          || (index > 0 && verses[index] <= verses[index - 1])) {
          throw new Error(`${code} ${chapter} verse sequence is invalid.`);
        }
      }
    }
    return Object.freeze({ code, chapters: maxChapter, verses: chapters });
  });
  const chapterCount = books.reduce((sum, book) => sum + book.chapters, 0);
  const verseCount = books.reduce((sum, book) => sum + [...book.verses.values()].reduce((subtotal, rows) => subtotal + rows.length, 0), 0);
  if (chapterCount !== EXPECTED_BSB_CHAPTERS || verseCount !== EXPECTED_BSB_VERSES) {
    throw new Error(`Canonical BSB inventory mismatch: ${chapterCount} chapters / ${verseCount} verses.`);
  }
  return Object.freeze({ scriptureManifest, books });
}

function chapterAlignment(path, expected, context) {
  const payload = readJson(path);
  const book = String(payload?.book ?? '').toUpperCase();
  const chapter = Number(payload?.chapter);
  if (book !== expected.code || chapter !== expected.chapter) {
    throw new Error(`Alignment identity mismatch in ${path}: expected ${expected.code} ${expected.chapter}.`);
  }
  if (!payload?.verses || typeof payload.verses !== 'object' || Array.isArray(payload.verses)) {
    throw new Error(`${book} ${chapter} has no verse timing map.`);
  }
  const actualVerses = Object.keys(payload.verses).map(Number).sort((a, b) => a - b);
  const expectedFirst = expected.verses[0];
  const leadingExtras = actualVerses.filter(verse => verse < expectedFirst);
  const displayedVerses = actualVerses.filter(verse => verse >= expectedFirst);
  const leadingPsalmSuperscription = expected.code === 'PSA'
    && leadingExtras.length > 0
    && leadingExtras.every((verse, index) => verse === index + 1)
    && leadingExtras[leadingExtras.length - 1] === expectedFirst - 1;
  if (leadingExtras.length > 0 && !leadingPsalmSuperscription) {
    throw new Error(`${book} ${chapter} has unexpected alignment verses before the BibleQuest display sequence.`);
  }
  if (displayedVerses.length !== expected.verses.length
    || displayedVerses.some((verse, index) => verse !== expected.verses[index])) {
    throw new Error(`${book} ${chapter} timing verse identity differs from the BibleQuest BSB pack.`);
  }

  let previousEnd = 0;
  let wordCount = 0;
  const verses = expected.verses.map(verse => {
    const words = payload.verses[String(verse)];
    if (!Array.isArray(words) || words.length === 0) throw new Error(`${book} ${chapter}:${verse} has no aligned words.`);
    let priorWordEnd = -1;
    for (const word of words) {
      const start = Number(word?.start), end = Number(word?.end);
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) {
        throw new Error(`${book} ${chapter}:${verse} contains invalid word timing.`);
      }
      if (priorWordEnd >= 0 && start + 0.000001 < priorWordEnd) {
        throw new Error(`${book} ${chapter}:${verse} word timing moves backward.`);
      }
      priorWordEnd = end;
      wordCount += 1;
    }
    const startSeconds = Number(words[0].start);
    const endSeconds = Number(words[words.length - 1].end);
    if (startSeconds + 0.000001 < previousEnd) {
      throw new Error(`${book} ${chapter}:${verse} overlaps the preceding verse timing.`);
    }
    previousEnd = endSeconds;
    return Object.freeze({ verse, startSeconds, endSeconds });
  });

  return Object.freeze({
    row: Object.freeze({
      schemaVersion: 1,
      translationId: 'bsb',
      contentVersion: HAYS_AUDIO_CONTENT_VERSION,
      scriptureContentVersion: context.scriptureContentVersion,
      book,
      chapter,
      durationSeconds: verses[verses.length - 1].endSeconds,
      source: HAYS_AUDIO_SOURCE,
      license: HAYS_AUDIO_LICENSE,
      alignmentSource: context.alignmentSource,
      verses: Object.freeze(verses),
    }),
    wordCount,
  });
}

export function generateHaysAlignmentManifest({
  root = process.cwd(),
  alignmentRoot,
  revision,
  output,
} = {}) {
  if (!alignmentRoot || !existsSync(alignmentRoot)) throw new Error('Pinned bsb-align checkout is required.');
  if (!REVISION.test(String(revision ?? ''))) throw new Error('Pinned bsb-align revision must be an exact 40-character SHA.');
  const canonical = canonicalBible(root);
  const alignmentSource = `${HAYS_ALIGNMENT_REPOSITORY}@${String(revision).toLowerCase()}`;
  const context = Object.freeze({
    scriptureContentVersion: canonical.scriptureManifest.contentVersion,
    alignmentSource,
  });
  const chapters = [];
  let wordCount = 0;

  for (const book of canonical.books) {
    const directory = resolve(alignmentRoot, 'output', book.code);
    if (!existsSync(directory)) throw new Error(`Alignment output is missing book ${book.code}.`);
    const files = readdirSync(directory).filter(name => ALIGNMENT_FILE.test(name)).sort();
    if (files.length !== book.chapters) {
      throw new Error(`${book.code} alignment chapter count mismatch: expected ${book.chapters}, found ${files.length}.`);
    }
    for (let chapter = 1; chapter <= book.chapters; chapter += 1) {
      const name = `${book.code}_${String(chapter).padStart(3, '0')}_words.json`;
      if (!files.includes(name)) throw new Error(`${book.code} alignment is missing chapter ${chapter}.`);
      const result = chapterAlignment(
        join(directory, name),
        { code: book.code, chapter, verses: book.verses.get(chapter) },
        context,
      );
      chapters.push(result.row);
      wordCount += result.wordCount;
    }
  }

  const verseCount = chapters.reduce((sum, chapter) => sum + chapter.verses.length, 0);
  if (chapters.length !== EXPECTED_BSB_CHAPTERS || verseCount !== EXPECTED_BSB_VERSES) {
    throw new Error(`Generated timing inventory mismatch: ${chapters.length} chapters / ${verseCount} verses.`);
  }
  const inventorySha256 = sha256(JSON.stringify(chapters));
  const manifest = Object.freeze({
    schemaVersion: 1,
    translationId: 'bsb',
    complete: true,
    audioContentVersion: HAYS_AUDIO_CONTENT_VERSION,
    scriptureContentVersion: canonical.scriptureManifest.contentVersion,
    alignmentSource,
    alignmentRevision: String(revision).toLowerCase(),
    alignmentInventorySha256: inventorySha256,
    alignmentContentVersion: `sha256-${inventorySha256}`,
    chapterCount: chapters.length,
    verseCount,
    wordCount,
    chapters: Object.freeze(chapters),
  });
  if (output) {
    const target = resolve(output);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(manifest) + '\n', 'utf8');
  }
  return manifest;
}

function usage() {
  return [
    'Generate a BibleQuest V6 Barry Hays verse-timing manifest from a pinned bsb-align checkout.',
    '',
    'node scripts/v6-generate-hays-alignment.mjs \\',
    '  --alignment-root external/bsb-align \\',
    '  --revision <40-char-sha> \\',
    '  --output data/v6-audio/bsb-hays-alignment.json',
  ].join('\n');
}

const invokedAsCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedAsCli) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
  } else {
    const manifest = generateHaysAlignmentManifest(args);
    console.log(
      `Generated Hays alignment ${manifest.alignmentContentVersion} for ${manifest.chapterCount} chapters / ${manifest.verseCount} verses / ${manifest.wordCount} words.`,
    );
  }
}

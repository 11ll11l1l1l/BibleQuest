import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateChapterAlignment } from '../src/v6/reader/audio-alignment.ts';

export const AUDIO_STORAGE_CEILING_BYTES = 10_000_000_000;
const BOOK_CODE = /^(?:[1-3])?[A-Z]{2,3}$/;
const BIBLE_BOOK_CHAPTERS = Object.freeze({
  GEN: 50, EXO: 40, LEV: 27, NUM: 36, DEU: 34, JOS: 24, JDG: 21, RUT: 4, '1SA': 31, '2SA': 24,
  '1KI': 22, '2KI': 25, '1CH': 29, '2CH': 36, EZR: 10, NEH: 13, EST: 10, JOB: 42, PSA: 150, PRO: 31,
  ECC: 12, SNG: 8, ISA: 66, JER: 52, LAM: 5, EZK: 48, DAN: 12, HOS: 14, JOL: 3, AMO: 9, OBA: 1,
  JON: 4, MIC: 7, NAM: 3, HAB: 3, ZEP: 3, HAG: 2, ZEC: 14, MAL: 4, MAT: 28, MRK: 16, LUK: 24,
  JHN: 21, ACT: 28, ROM: 16, '1CO': 16, '2CO': 13, GAL: 6, EPH: 6, PHP: 4, COL: 4,
  '1TH': 5, '2TH': 3, '1TI': 6, '2TI': 4, TIT: 3, PHM: 1, HEB: 13, JAS: 5, '1PE': 5, '2PE': 3,
  '1JN': 5, '2JN': 1, '3JN': 1, JUD: 1, REV: 22,
});
const NORMALIZED_AUDIO_FILE = /^((?:[1-3])?[A-Z]{2,3})-(\d+)\.(mp3|m4a|ogg|aac)$/i;
const OPENBIBLE_HAYS_FILE = /^BSB_(\d{2})_([A-Za-z0-9]+)_(\d{3})_H\.mp3$/i;
const OPENBIBLE_BOOK_TOKENS = Object.freeze([
  'Gen', 'Exo', 'Lev', 'Num', 'Deu', 'Jos', 'Jdg', 'Rut', '1Sa', '2Sa', '1Ki', '2Ki', '1Ch', '2Ch',
  'Ezr', 'Neh', 'Est', 'Job', 'Psa', 'Pro', 'Ecc', 'Sng', 'Isa', 'Jer', 'Lam', 'Ezk', 'Dan', 'Hos',
  'Jol', 'Amo', 'Oba', 'Jon', 'Mic', 'Nam', 'Hab', 'Zep', 'Hag', 'Zec', 'Mal', 'Mat', 'Mrk', 'Luk',
  'Jhn', 'Act', 'Rom', '1Co', '2Co', 'Gal', 'Eph', 'Php', 'Col', '1Th', '2Th', '1Ti', '2Ti', 'Tit',
  'Phm', 'Heb', 'Jas', '1Pe', '2Pe', '1Jn', '2Jn', '3Jn', 'Jud', 'Rev',
]);
const SHA256 = /^[a-f0-9]{64}$/;

function fail(message) {
  throw new Error(message);
}

function safeBaseUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    fail('R2 public base URL must be HTTPS and contain no credentials, query, or fragment.');
  }
  return url.href.replace(/\/$/, '');
}

function chapterKey(book, chapter) {
  return `${book.toUpperCase()}-${chapter}`;
}

/** Accept normalized names and OpenBible's published BSB_XX_Book_NNN_H.mp3 names. */
function parseAudioFilename(filename) {
  const normalized = NORMALIZED_AUDIO_FILE.exec(filename);
  if (normalized) {
    const book = normalized[1].toUpperCase(), chapter = Number(normalized[2]);
    if (!BIBLE_BOOK_CHAPTERS[book] || !Number.isSafeInteger(chapter) || chapter < 1 || chapter > BIBLE_BOOK_CHAPTERS[book]) return null;
    return Object.freeze({ book, chapter, extension: normalized[3].toLowerCase() });
  }
  const upstream = OPENBIBLE_HAYS_FILE.exec(filename);
  if (!upstream) return null;
  const bookNumber = Number(upstream[1]);
  const book = Object.keys(BIBLE_BOOK_CHAPTERS)[bookNumber - 1];
  const expectedToken = OPENBIBLE_BOOK_TOKENS[bookNumber - 1];
  const chapter = Number(upstream[3]);
  if (!book || !expectedToken || upstream[2].toLowerCase() !== expectedToken.toLowerCase()
    || !Number.isSafeInteger(chapter) || chapter < 1 || chapter > BIBLE_BOOK_CHAPTERS[book]) return null;
  return Object.freeze({ book, chapter, extension: 'mp3' });
}

async function hashFile(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

export async function buildAudioIngestManifest({ inputDirectory, publicBaseUrl, storageCeilingBytes = AUDIO_STORAGE_CEILING_BYTES }) {
  const root = resolve(inputDirectory);
  const metadata = JSON.parse(await readFile(join(root, 'source.json'), 'utf8'));
  const alignments = JSON.parse(await readFile(join(root, 'alignments.json'), 'utf8'));
  const baseUrl = safeBaseUrl(publicBaseUrl);
  if (metadata.translationId !== 'bsb') fail('The initial V6 audio manifest builder only accepts translationId "bsb".');
  if (metadata.rights !== 'verified' || metadata.delivery !== 'downloadable' || metadata.offlineCopy !== 'allowed' || metadata.textAlignment !== 'exact') {
    fail('BSB audio ingest requires verified rights, downloadable permission, and exact text alignment.');
  }
  for (const key of ['source', 'sourceUrl', 'license', 'attribution', 'rightsEvidence', 'alignmentSource', 'reviewedBy', 'reviewedAt', 'contentVersion', 'scriptureContentVersion']) {
    if (typeof metadata[key] !== 'string' || metadata[key].trim() === '') fail(`source.json requires ${key}.`);
  }
  if (!Number.isFinite(Date.parse(metadata.reviewedAt))) fail('source.json reviewedAt must be an ISO-compatible timestamp.');
  const sourceUrl = new URL(metadata.sourceUrl);
  if (sourceUrl.protocol !== 'https:' || sourceUrl.username || sourceUrl.password) fail('Audio sourceUrl must use safe HTTPS.');
  if (!Array.isArray(alignments) || alignments.length === 0) fail('alignments.json must contain chapter timing records.');
  if (!Number.isSafeInteger(storageCeilingBytes) || storageCeilingBytes <= 0) fail('Storage ceiling must be a positive integer byte count.');

  const alignmentByChapter = new Map();
  for (const row of alignments) {
    const book = String(row?.book ?? '').toUpperCase();
    const chapter = row?.chapter;
    if (!BOOK_CODE.test(book) || !Number.isSafeInteger(chapter) || chapter < 1) fail('Alignment contains invalid chapter identity.');
    const key = chapterKey(book, chapter);
    if (alignmentByChapter.has(key)) fail(`Duplicate alignment for ${key}.`);
    if (row.translationId !== 'bsb' || row.alignmentSource !== metadata.alignmentSource
      || row.scriptureContentVersion !== metadata.scriptureContentVersion) fail(`Alignment provenance/translation mismatch for ${key}.`);
    const validation = validateChapterAlignment(row, { translationId: 'bsb', book, chapter });
    if (!validation.valid) fail(`Alignment ${key} is invalid: ${validation.issues.join('; ')}.`);
    alignmentByChapter.set(key, row);
  }

  const files = (await readdir(root, { withFileTypes: true }))
    .filter(entry => entry.isFile() && parseAudioFilename(entry.name))
    .map(entry => entry.name)
    .sort((left, right) => left.localeCompare(right));
  if (files.length !== alignmentByChapter.size) fail('Every aligned chapter must have exactly one staged audio file, and no chapter may be missing.');
  const segments = [];
  const seen = new Set();
  let totalBytes = 0;
  for (const filename of files) {
    const parsed = parseAudioFilename(filename);
    const { book, chapter } = parsed;
    if (!Number.isSafeInteger(chapter) || chapter < 1) fail(`Invalid chapter filename: ${filename}`);
    const key = chapterKey(book, chapter);
    if (seen.has(key) || !alignmentByChapter.has(key)) fail(`Audio chapter ${key} is duplicated or has no matching alignment.`);
    seen.add(key);
    const path = join(root, filename);
    const details = await stat(path);
    if (!details.isFile() || details.size <= 0) fail(`Audio chapter ${key} is empty or invalid.`);
    const sha256 = await hashFile(path);
    totalBytes += details.size;
    if (!Number.isSafeInteger(totalBytes) || totalBytes >= storageCeilingBytes) fail(`Hosted BSB audio is at or above the ${storageCeilingBytes}-byte storage ceiling.`);
    segments.push({
      id: key,
      book,
      chapter,
      byteLength: details.size,
      sha256,
      url: `${baseUrl}/${encodeURIComponent(metadata.contentVersion)}/${encodeURIComponent(filename)}`,
      alignment: key,
    });
  }
  if (seen.size !== alignmentByChapter.size) fail('One or more alignment rows are missing their staged audio chapter.');
  return Object.freeze({
    schemaVersion: 1,
    translationId: 'bsb',
    contentVersion: metadata.contentVersion,
    source: {
      translationId: 'bsb', source: metadata.source, sourceUrl: sourceUrl.href,
      license: metadata.license, rights: 'verified', delivery: 'downloadable',
      scriptureContentVersion: metadata.scriptureContentVersion,
      textAlignment: 'exact', attribution: metadata.attribution,
      permissions: Object.freeze({ stream: 'allowed', offlineCopy: 'allowed' }),
      rightsEvidence: metadata.rightsEvidence, reviewedBy: metadata.reviewedBy, reviewedAt: metadata.reviewedAt,
    },
    alignmentSource: metadata.alignmentSource,
    totalBytes,
    segments,
    alignments,
  });
}

/** Reports evidence/package completeness without relaxing the publication gate. */
export async function inspectAudioIngestStaging({ inputDirectory, storageCeilingBytes = AUDIO_STORAGE_CEILING_BYTES }) {
  const root = resolve(inputDirectory);
  if (!Number.isSafeInteger(storageCeilingBytes) || storageCeilingBytes <= 0) fail('Storage ceiling must be a positive integer byte count.');
  const expected = Object.entries(BIBLE_BOOK_CHAPTERS).flatMap(([book, chapters]) =>
    Array.from({ length: chapters }, (_, index) => chapterKey(book, index + 1)));
  const missingFiles = [];
  const missingAlignments = [];
  const invalidAlignments = [];
  const malformedFiles = [];
  const seenChapterKeys = new Set();
  let totalBytes = 0;
  try {
    const entries = await readdir(root, { withFileTypes: true });
    const present = new Map();
    for (const entry of entries) {
      if (!entry.isFile() || !/\.(mp3|m4a|ogg|aac)$/i.test(entry.name)) continue;
      const details = await stat(join(root, entry.name));
      if (details.isFile() && details.size > 0) totalBytes += details.size;
      const parsed = parseAudioFilename(entry.name);
      if (!parsed) { malformedFiles.push(entry.name); continue; }
      const key = chapterKey(parsed.book, parsed.chapter);
      if (seenChapterKeys.has(key)) {
        malformedFiles.push(entry.name, `${key} (duplicate chapter asset)`);
        continue;
      }
      seenChapterKeys.add(key);
      if (!details.isFile() || details.size <= 0) { malformedFiles.push(entry.name); continue; }
      present.set(key, true);
    }
    let alignments = [];
    try { alignments = JSON.parse(await readFile(join(root, 'alignments.json'), 'utf8')); } catch { /* report absent/invalid alignments below */ }
    let metadata = null;
    try { metadata = JSON.parse(await readFile(join(root, 'source.json'), 'utf8')); } catch { /* source evidence reported below */ }
    const aligned = new Set();
    if (Array.isArray(alignments)) {
      for (const row of alignments) {
        const book = String(row?.book ?? '').toUpperCase();
        const chapter = Number(row?.chapter);
        const key = chapterKey(book, chapter);
        if (aligned.has(key)) { invalidAlignments.push(`${key}: duplicate alignment`); continue; }
        const valid = BOOK_CODE.test(book) && BIBLE_BOOK_CHAPTERS[book] && chapter >= 1 && chapter <= BIBLE_BOOK_CHAPTERS[book]
          && row.translationId === 'bsb' && row.alignmentSource === metadata?.alignmentSource
          && row.contentVersion === metadata?.contentVersion
          && row.scriptureContentVersion === metadata?.scriptureContentVersion
          && row.source === metadata?.source && row.license === metadata?.license
          && validateChapterAlignment(row, { translationId: 'bsb', book, chapter }).valid;
        if (valid) aligned.add(key);
        else invalidAlignments.push(`${key}: invalid identity, revision or verse timings`);
      }
    } else invalidAlignments.push('alignments.json: expected an array');
    for (const key of expected) {
      if (!present.has(key)) missingFiles.push(key);
      if (!aligned.has(key)) missingAlignments.push(key);
    }
    let sourceEvidence = { present: false, missing: ['source.json'] };
    try {
      metadata ??= JSON.parse(await readFile(join(root, 'source.json'), 'utf8'));
      const required = ['source', 'sourceUrl', 'license', 'attribution', 'rightsEvidence', 'alignmentSource', 'reviewedBy', 'reviewedAt', 'contentVersion', 'scriptureContentVersion'];
      const missing = required.filter(key => typeof metadata[key] !== 'string' || !metadata[key].trim());
      sourceEvidence = {
        present: true,
        missing,
        rightsVerified: metadata.rights === 'verified' && metadata.delivery === 'downloadable',
        alignmentExact: metadata.translationId === 'bsb' && metadata.textAlignment === 'exact',
      };
    } catch { /* report absent/invalid source evidence below */ }
    const ready = missingFiles.length === 0 && missingAlignments.length === 0 && malformedFiles.length === 0 && invalidAlignments.length === 0
      && sourceEvidence.present && sourceEvidence.missing.length === 0 && sourceEvidence.rightsVerified && sourceEvidence.alignmentExact
      && Number.isSafeInteger(totalBytes) && totalBytes < storageCeilingBytes;
    return Object.freeze({
      translationId: 'bsb', expectedChapters: expected.length,
      stagedAudioChapters: present.size,
      stagedAlignmentChapters: aligned.size,
      totalBytes, storageCeilingBytes, storageRemainingBytes: Math.max(0, storageCeilingBytes - totalBytes),
      belowStorageCeiling: Number.isSafeInteger(totalBytes) && totalBytes < storageCeilingBytes,
      missingFiles, missingAlignments, invalidAlignments, malformedFiles, sourceEvidence, readyForManifest: ready,
    });
  } catch (error) {
    fail(`Cannot inspect staging directory: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main(argv) {
  const [inputDirectory, publicBaseUrl, outputPath] = argv;
  if (argv[0] === '--inspect') {
    if (!argv[1]) fail('Usage: node scripts/v6-audio-ingest-manifest.mjs --inspect <staging-dir> [report.json]');
    const report = await inspectAudioIngestStaging({ inputDirectory: argv[1] });
    const serialized = `${JSON.stringify(report, null, 2)}\n`;
    if (argv[2]) await writeFile(resolve(argv[2]), serialized, { flag: 'wx' });
    console.log(serialized);
    if (!report.readyForManifest) process.exitCode = 2;
    return;
  }
  if (!inputDirectory || !publicBaseUrl || !outputPath) {
    fail('Usage: node scripts/v6-audio-ingest-manifest.mjs <staging-dir> <https-r2-base-url> <output.json>');
  }
  const manifest = await buildAudioIngestManifest({ inputDirectory, publicBaseUrl });
  await writeFile(resolve(outputPath), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
  console.log(`Validated ${manifest.segments.length} BSB chapters (${manifest.totalBytes} bytes); wrote ${basename(outputPath)}.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}

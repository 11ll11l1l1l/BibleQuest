import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { readdir, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OPENBIBLE_SOURCE_BASE = 'https://openbible.com/audio/hays/';
const SOURCE_LABEL = 'OpenBible Barry Hays';
const SHA256 = /^[a-f0-9]{64}$/;

const BOOKS = Object.freeze([
  ['GEN', 'Gen', 50], ['EXO', 'Exo', 40], ['LEV', 'Lev', 27], ['NUM', 'Num', 36], ['DEU', 'Deu', 34],
  ['JOS', 'Jos', 24], ['JDG', 'Jdg', 21], ['RUT', 'Rut', 4], ['1SA', '1Sa', 31], ['2SA', '2Sa', 24],
  ['1KI', '1Ki', 22], ['2KI', '2Ki', 25], ['1CH', '1Ch', 29], ['2CH', '2Ch', 36], ['EZR', 'Ezr', 10],
  ['NEH', 'Neh', 13], ['EST', 'Est', 10], ['JOB', 'Job', 42], ['PSA', 'Psa', 150], ['PRO', 'Pro', 31],
  ['ECC', 'Ecc', 12], ['SNG', 'Sng', 8], ['ISA', 'Isa', 66], ['JER', 'Jer', 52], ['LAM', 'Lam', 5],
  ['EZK', 'Ezk', 48], ['DAN', 'Dan', 12], ['HOS', 'Hos', 14], ['JOL', 'Jol', 3], ['AMO', 'Amo', 9],
  ['OBA', 'Oba', 1], ['JON', 'Jon', 4], ['MIC', 'Mic', 7], ['NAM', 'Nam', 3], ['HAB', 'Hab', 3],
  ['ZEP', 'Zep', 3], ['HAG', 'Hag', 2], ['ZEC', 'Zec', 14], ['MAL', 'Mal', 4], ['MAT', 'Mat', 28],
  ['MRK', 'Mrk', 16], ['LUK', 'Luk', 24], ['JHN', 'Jhn', 21], ['ACT', 'Act', 28], ['ROM', 'Rom', 16],
  ['1CO', '1Co', 16], ['2CO', '2Co', 13], ['GAL', 'Gal', 6], ['EPH', 'Eph', 6], ['PHP', 'Php', 4],
  ['COL', 'Col', 4], ['1TH', '1Th', 5], ['2TH', '2Th', 3], ['1TI', '1Ti', 6], ['2TI', '2Ti', 4],
  ['TIT', 'Tts', 3], ['PHM', 'Phm', 1], ['HEB', 'Heb', 13], ['JAS', 'Jas', 5], ['1PE', '1Pe', 5],
  ['2PE', '2Pe', 3], ['1JN', '1Jn', 5], ['2JN', '2Jn', 1], ['3JN', '3Jn', 1], ['JUD', 'Jud', 1],
  ['REV', 'Rev', 22],
]);

function fail(message) {
  throw new Error(message);
}

async function hashFile(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

function defaultDurationResolver(path) {
  let raw;
  try {
    raw = execFileSync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      path,
    ], { encoding: 'utf8' }).trim();
  } catch (error) {
    fail('ffprobe could not measure staged Hays audio duration for ' + path + ': '
      + (error instanceof Error ? error.message : String(error)));
  }
  const duration = Number(raw);
  if (!Number.isFinite(duration) || duration <= 0) fail('Invalid staged Hays audio duration for ' + path + '.');
  return Number(duration.toFixed(6));
}

export function expectedHaysAudioFiles() {
  const rows = [];
  BOOKS.forEach(([book, token, chapters], index) => {
    for (let chapter = 1; chapter <= chapters; chapter += 1) {
      rows.push(Object.freeze({
        book,
        chapter,
        filename: 'BSB_' + String(index + 1).padStart(2, '0') + '_' + token + '_' + String(chapter).padStart(3, '0') + '_H.mp3',
      }));
    }
  });
  if (rows.length !== 1189) fail('Internal Hays chapter inventory is not the canonical 1,189 chapters.');
  return Object.freeze(rows);
}

export function computeHaysAudioInventoryDigest(rows) {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(rows.map(row => ({
    book: row.book,
    chapter: row.chapter,
    filename: row.filename,
    byteLength: row.byteLength,
    sha256: row.sha256,
    durationSeconds: row.durationSeconds,
  }))));
  return hash.digest('hex');
}

export function validateHaysAudioInventory(inventory, { requireComplete = true } = {}) {
  const issues = [];
  if (!inventory || typeof inventory !== 'object') {
    return Object.freeze({ valid: false, issues: Object.freeze(['Hays audio inventory is required']) });
  }
  if (inventory.schemaVersion !== 1) issues.push('unsupported Hays audio inventory schema');
  if (inventory.translationId !== 'bsb') issues.push('Hays audio inventory must be BSB');
  if (inventory.narrator !== 'Barry Hays') issues.push('Hays audio inventory narrator mismatch');
  if (inventory.sourceBaseUrl !== OPENBIBLE_SOURCE_BASE) issues.push('Hays audio inventory source URL mismatch');
  if (!Array.isArray(inventory.files)) issues.push('Hays audio inventory files are required');
  if (!Number.isSafeInteger(inventory.chapters) || inventory.chapters < 1) issues.push('Hays audio inventory chapter count is invalid');
  if (!Number.isSafeInteger(inventory.totalBytes) || inventory.totalBytes < 1) issues.push('Hays audio inventory byte total is invalid');
  if (!Number.isFinite(inventory.totalDurationSeconds) || inventory.totalDurationSeconds <= 0) issues.push('Hays audio inventory duration total is invalid');
  if (!SHA256.test(String(inventory.inventorySha256 ?? ''))) issues.push('Hays audio inventory checksum is invalid');
  if (inventory.contentVersion !== 'sha256-' + String(inventory.inventorySha256 ?? '')) {
    issues.push('Hays audio content version does not match its inventory checksum');
  }

  if (Array.isArray(inventory.files)) {
    const expected = expectedHaysAudioFiles();
    const expectedByKey = new Map(expected.map(row => [row.book + '-' + row.chapter, row]));
    const seen = new Set();
    let totalBytes = 0;
    let totalDurationSeconds = 0;
    for (const row of inventory.files) {
      const book = String(row?.book ?? '').toUpperCase();
      const chapter = Number(row?.chapter);
      const key = book + '-' + chapter;
      const canonical = expectedByKey.get(key);
      if (!canonical || seen.has(key)) {
        issues.push('invalid or duplicate Hays audio chapter ' + key);
        continue;
      }
      seen.add(key);
      if (row.filename !== canonical.filename) issues.push('Hays audio filename mismatch for ' + key);
      if (!Number.isSafeInteger(row.byteLength) || row.byteLength < 1) issues.push('Hays audio byte length is invalid for ' + key);
      if (!SHA256.test(String(row.sha256 ?? ''))) issues.push('Hays audio checksum is invalid for ' + key);
      if (!Number.isFinite(row.durationSeconds) || row.durationSeconds <= 0) issues.push('Hays audio duration is invalid for ' + key);
      if (row.sourceUrl !== OPENBIBLE_SOURCE_BASE + canonical.filename) issues.push('Hays audio source URL mismatch for ' + key);
      if (Number.isSafeInteger(row.byteLength) && row.byteLength > 0) totalBytes += row.byteLength;
      if (Number.isFinite(row.durationSeconds) && row.durationSeconds > 0) totalDurationSeconds += row.durationSeconds;
    }
    if (inventory.chapters !== inventory.files.length) issues.push('Hays audio chapter count does not match files');
    if (requireComplete && (inventory.files.length !== 1189 || seen.size !== 1189)) issues.push('complete Hays audio inventory requires all 1,189 chapters');
    if (totalBytes !== inventory.totalBytes) issues.push('Hays audio byte total mismatch');
    if (Math.abs(Number(totalDurationSeconds.toFixed(6)) - Number(inventory.totalDurationSeconds)) > 0.000001) {
      issues.push('Hays audio duration total mismatch');
    }
    if (SHA256.test(String(inventory.inventorySha256 ?? ''))) {
      const digest = computeHaysAudioInventoryDigest(inventory.files);
      if (digest !== inventory.inventorySha256) issues.push('Hays audio inventory checksum mismatch');
    }
  }
  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze(issues) });
}

export async function snapshotStagedHaysSource({
  audioDirectory,
  durationResolver = defaultDurationResolver,
} = {}) {
  if (typeof audioDirectory !== 'string' || !audioDirectory.trim()) fail('Staged Hays audio directory is required.');
  if (typeof durationResolver !== 'function') fail('Audio duration resolver is required.');

  const root = resolve(audioDirectory);
  const rootStat = await stat(root).catch(() => null);
  if (!rootStat?.isDirectory()) fail('Staged Hays audio directory does not exist: ' + root);

  const expected = expectedHaysAudioFiles();
  const expectedByName = new Map(expected.map(row => [row.filename, row]));
  const entries = await readdir(root, { withFileTypes: true });
  const mp3Names = entries.filter(entry => entry.isFile() && /\.mp3$/i.test(entry.name)).map(entry => entry.name).sort();

  const unexpected = mp3Names.filter(name => !expectedByName.has(name));
  const present = new Set(mp3Names.filter(name => expectedByName.has(name)));
  const missing = expected.filter(row => !present.has(row.filename)).map(row => row.filename);
  if (unexpected.length || missing.length) {
    fail('Staged Hays source must contain exactly the canonical 1,189 OpenBible chapter MP3s; '
      + 'missing=' + missing.length + ', unexpected=' + unexpected.length + '.');
  }

  const files = [];
  let totalBytes = 0;
  let totalDurationSeconds = 0;
  for (const expectedRow of expected) {
    const path = join(root, expectedRow.filename);
    const details = await stat(path);
    if (!details.isFile() || details.size <= 0) fail('Staged Hays audio file is empty or invalid: ' + expectedRow.filename);
    const sha256 = await hashFile(path);
    if (!SHA256.test(sha256)) fail('Could not hash staged Hays audio file: ' + expectedRow.filename);
    const durationSeconds = await durationResolver(path, expectedRow);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      fail('Invalid staged Hays audio duration for ' + expectedRow.filename + '.');
    }
    totalBytes += details.size;
    totalDurationSeconds += durationSeconds;
    if (!Number.isSafeInteger(totalBytes)) fail('Staged Hays audio byte total exceeds safe integer range.');
    files.push(Object.freeze({
      ...expectedRow,
      byteLength: details.size,
      sha256,
      durationSeconds: Number(Number(durationSeconds).toFixed(6)),
      sourceUrl: OPENBIBLE_SOURCE_BASE + expectedRow.filename,
    }));
  }

  const digest = computeHaysAudioInventoryDigest(files);
  const inventory = Object.freeze({
    schemaVersion: 1,
    translationId: 'bsb',
    narrator: 'Barry Hays',
    source: SOURCE_LABEL,
    sourceBaseUrl: OPENBIBLE_SOURCE_BASE,
    chapters: files.length,
    totalBytes,
    totalDurationSeconds: Number(totalDurationSeconds.toFixed(6)),
    inventorySha256: digest,
    contentVersion: 'sha256-' + digest,
    files: Object.freeze(files),
  });
  const validation = validateHaysAudioInventory(inventory, { requireComplete: true });
  if (!validation.valid) fail('Staged Hays audio inventory failed validation: ' + validation.issues.join('; ') + '.');
  return inventory;
}


async function main(argv) {
  const [audioDirectory, outputPath] = argv;
  if (!audioDirectory || argv.length > 2) {
    fail('Usage: node scripts/v6-hays-source-inventory.mjs <staged-hays-audio-dir> [inventory-output.json]');
  }

  const inventory = await snapshotStagedHaysSource({ audioDirectory });
  const json = JSON.stringify(inventory, null, 2) + '\n';
  if (outputPath) {
    const destination = resolve(outputPath);
    await writeFile(destination, json, { flag: 'wx' });
    console.error('Wrote exact Hays source inventory to ' + destination + '.');
  }
  process.stdout.write(json);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}

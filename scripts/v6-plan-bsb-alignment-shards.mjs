import { access, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED_CHAPTERS = 1189;
const OUTPUT_PATH = /^((?:[1-3])?[A-Z]{2,3})\/\1_(\d{3})_words\.json$/;

function fail(message) {
  throw new Error(message);
}

function assertPlan(plan) {
  if (!plan || plan.schemaVersion !== 2 || plan.translationId !== 'bsb'
    || plan.expectedChapters !== EXPECTED_CHAPTERS
    || !Array.isArray(plan.expectedOutputFiles)
    || plan.expectedOutputFiles.length !== EXPECTED_CHAPTERS
    || typeof plan.alignerDirectory !== 'string' || !plan.alignerDirectory.trim()
    || typeof plan.audioDirectory !== 'string' || !plan.audioDirectory.trim()
    || typeof plan.textDirectory !== 'string' || !plan.textDirectory.trim()
    || typeof plan.outputDirectory !== 'string' || !plan.outputDirectory.trim()
    || typeof plan.scriptureContentVersion !== 'string' || !plan.scriptureContentVersion.trim()
    || typeof plan.audioContentVersion !== 'string' || !plan.audioContentVersion.trim()
    || typeof plan.audioInventorySha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(plan.audioInventorySha256)) {
    fail('A complete exact-identity BSB regeneration plan is required.');
  }
}

function parseOutputPath(path) {
  const normalized = String(path ?? '').replaceAll('\\', '/');
  const match = normalized.match(OUTPUT_PATH);
  if (!match) fail('Unexpected BSB alignment output path: ' + normalized);
  return Object.freeze({ path: normalized, book: match[1], chapter: Number(match[2]) });
}

export async function findMissingBsbAlignmentOutputs(plan, { accessFn = access } = {}) {
  assertPlan(plan);
  if (typeof accessFn !== 'function') fail('An output access resolver is required.');
  const missing = [];
  for (const relativePath of plan.expectedOutputFiles) {
    parseOutputPath(relativePath);
    try {
      await accessFn(join(plan.outputDirectory, relativePath));
    } catch {
      missing.push(relativePath);
    }
  }
  return Object.freeze(missing);
}

export function buildBsbAlignmentShardPlan(plan, missingOutputFiles, {
  shardCount = 4,
  python = 'python3',
} = {}) {
  assertPlan(plan);
  if (!Number.isSafeInteger(shardCount) || shardCount < 1 || shardCount > 16) {
    fail('BSB alignment shard count must be an integer from 1 through 16.');
  }
  if (typeof python !== 'string' || !python.trim()) fail('Python executable is required.');
  if (!Array.isArray(missingOutputFiles)) fail('Missing BSB alignment outputs are required.');

  const seen = new Set();
  const byBook = new Map();
  for (const path of missingOutputFiles) {
    const row = parseOutputPath(path);
    if (seen.has(row.path)) fail('Duplicate missing BSB alignment output: ' + row.path);
    seen.add(row.path);
    if (!plan.expectedOutputFiles.includes(row.path)) {
      fail('Missing BSB output is not part of the exact regeneration plan: ' + row.path);
    }
    const chapters = byBook.get(row.book) ?? [];
    chapters.push(row.chapter);
    byBook.set(row.book, chapters);
  }

  const books = [...byBook.entries()]
    .map(([book, chapters]) => Object.freeze({
      book,
      chapters: Object.freeze([...chapters].sort((a, b) => a - b)),
      count: chapters.length,
    }))
    .sort((left, right) => right.count - left.count || left.book.localeCompare(right.book));

  const shards = Array.from({ length: shardCount }, (_, index) => ({
    shard: index + 1,
    books: [],
    chapters: 0,
  }));
  for (const book of books) {
    shards.sort((left, right) => left.chapters - right.chapters || left.shard - right.shard);
    const target = shards[0];
    target.books.push(book);
    target.chapters += book.count;
  }
  shards.sort((left, right) => left.shard - right.shard);

  const planned = shards.map(shard => Object.freeze({
    shard: shard.shard,
    chapters: shard.chapters,
    books: Object.freeze(shard.books.map(row => Object.freeze({
      book: row.book,
      chapters: row.chapters,
      count: row.count,
    }))),
    commands: Object.freeze(shard.books.map(row => Object.freeze({
      executable: python.trim(),
      cwd: plan.alignerDirectory,
      args: Object.freeze([
        join(plan.alignerDirectory, 'align_book.py'),
        '--book', row.book,
        '--audio-dir', plan.audioDirectory,
        '--text-dir', plan.textDirectory,
        '--output-dir', plan.outputDirectory,
      ]),
    }))),
  }));

  return Object.freeze({
    schemaVersion: 1,
    translationId: 'bsb',
    scriptureContentVersion: plan.scriptureContentVersion,
    audioContentVersion: plan.audioContentVersion,
    audioInventorySha256: plan.audioInventorySha256,
    expectedChapters: EXPECTED_CHAPTERS,
    remainingChapters: missingOutputFiles.length,
    shardCount,
    shards: Object.freeze(planned),
  });
}

async function main(argv) {
  let python = 'python3';
  let outputPath = null;
  const args = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--python') {
      python = argv[index + 1];
      if (!python) fail('--python requires an executable.');
      index += 1;
      continue;
    }
    if (argv[index] === '--output') {
      outputPath = argv[index + 1];
      if (!outputPath) fail('--output requires a JSON path.');
      index += 1;
      continue;
    }
    args.push(argv[index]);
  }

  const [planPath, shardCountRaw] = args;
  if (!planPath || !shardCountRaw || args.length !== 2) {
    fail('Usage: node scripts/v6-plan-bsb-alignment-shards.mjs <regeneration-plan.json> <shard-count> [--python <python3>] [--output <plan.json>]');
  }
  const plan = JSON.parse(await readFile(resolve(planPath), 'utf8'));
  const missing = await findMissingBsbAlignmentOutputs(plan);
  const result = buildBsbAlignmentShardPlan(plan, missing, {
    shardCount: Number(shardCountRaw),
    python,
  });
  const json = JSON.stringify(result, null, 2) + '\n';
  if (outputPath) await writeFile(resolve(outputPath), json, { flag: 'wx' });
  process.stdout.write(json);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

import { expectedHaysAudioFiles } from './v6-hays-source-inventory.mjs';

const SOURCE_BASE_URL = 'https://openbible.com/audio/hays/';
const SOURCE_LABEL = 'OpenBible Barry Hays';
const MAX_SHARDS = 32;
const FETCH_ATTEMPTS = 4;

function fail(message) {
  throw new Error(message);
}

function assertShard(index, count) {
  if (!Number.isSafeInteger(index) || !Number.isSafeInteger(count)
    || count < 1 || count > MAX_SHARDS || index < 1 || index > count) {
    fail('Hays source shard must use 1 <= shard-index <= shard-count <= ' + MAX_SHARDS + '.');
  }
}

export function planHaysSourceShard({ shardIndex, shardCount }) {
  assertShard(shardIndex, shardCount);
  const expected = expectedHaysAudioFiles();
  const files = expected.filter((_, offset) => (offset % shardCount) === (shardIndex - 1));
  if (!files.length) fail('Hays source shard is empty.');
  return Object.freeze({
    shardIndex,
    shardCount,
    chapters: files.length,
    files: Object.freeze(files),
  });
}

async function sleep(ms) {
  await new Promise(resolvePromise => setTimeout(resolvePromise, ms));
}

async function fetchToFile(url, path, {
  fetchImpl = globalThis.fetch,
  attempts = FETCH_ATTEMPTS,
} = {}) {
  if (typeof fetchImpl !== 'function') fail('Global fetch is unavailable.');
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(120000),
        headers: {
          'user-agent': 'BibleQuest-V6-source-certification/1.0',
          accept: 'audio/mpeg,application/octet-stream;q=0.9,*/*;q=0.1',
        },
      });
      if (!response.ok || !response.body) {
        throw new Error('HTTP ' + response.status + ' ' + response.statusText);
      }
      await pipeline(Readable.fromWeb(response.body), await import('node:fs').then(({ createWriteStream }) => createWriteStream(path)));
      return;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      await sleep(1000 * (2 ** (attempt - 1)));
    }
  }
  fail('Could not download ' + url + ' after ' + attempts + ' attempts: '
    + (lastError instanceof Error ? lastError.message : String(lastError)));
}

async function hashFile(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

function durationSeconds(path) {
  let raw;
  try {
    raw = execFileSync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      path,
    ], { encoding: 'utf8' }).trim();
  } catch (error) {
    fail('ffprobe could not measure downloaded Hays audio ' + path + ': '
      + (error instanceof Error ? error.message : String(error)));
  }
  const duration = Number(raw);
  if (!Number.isFinite(duration) || duration <= 0) fail('Invalid Hays audio duration for ' + path + '.');
  return Number(duration.toFixed(6));
}

export async function snapshotRemoteHaysSourceShard({
  shardIndex,
  shardCount,
  sourceBaseUrl = SOURCE_BASE_URL,
  fetchImpl = globalThis.fetch,
} = {}) {
  assertShard(shardIndex, shardCount);
  if (sourceBaseUrl !== SOURCE_BASE_URL) fail('Hays source base URL must remain pinned to OpenBible Barry Hays.');
  const plan = planHaysSourceShard({ shardIndex, shardCount });
  const root = await mkdtemp(join(tmpdir(), 'bq-hays-source-'));
  const rows = [];
  let totalBytes = 0;
  let totalDurationSeconds = 0;

  try {
    for (const chapter of plan.files) {
      const target = join(root, chapter.filename);
      const sourceUrl = sourceBaseUrl + chapter.filename;
      await fetchToFile(sourceUrl, target, { fetchImpl });
      const details = await stat(target);
      if (!details.isFile() || details.size <= 0) fail('Downloaded Hays audio is empty: ' + chapter.filename);
      const sha256 = await hashFile(target);
      if (!/^[a-f0-9]{64}$/.test(sha256)) fail('Could not hash downloaded Hays audio: ' + chapter.filename);
      const measuredDuration = durationSeconds(target);
      totalBytes += details.size;
      totalDurationSeconds += measuredDuration;
      if (!Number.isSafeInteger(totalBytes)) fail('Hays source shard byte total exceeds safe integer range.');
      rows.push(Object.freeze({
        ...chapter,
        byteLength: details.size,
        sha256,
        durationSeconds: measuredDuration,
        sourceUrl,
      }));
      await rm(target, { force: true });
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }

  return Object.freeze({
    schemaVersion: 1,
    translationId: 'bsb',
    narrator: 'Barry Hays',
    source: SOURCE_LABEL,
    sourceBaseUrl,
    shardIndex,
    shardCount,
    chapters: rows.length,
    totalBytes,
    totalDurationSeconds: Number(totalDurationSeconds.toFixed(6)),
    files: Object.freeze(rows),
  });
}

async function main(argv) {
  const [shardIndexRaw, shardCountRaw, outputPath] = argv;
  if (!shardIndexRaw || !shardCountRaw || !outputPath || argv.length !== 3) {
    fail('Usage: node scripts/v6-fetch-hays-source-shard.mjs <shard-index> <shard-count> <output.json>');
  }
  const result = await snapshotRemoteHaysSourceShard({
    shardIndex: Number(shardIndexRaw),
    shardCount: Number(shardCountRaw),
  });
  const destination = resolve(outputPath);
  await writeFile(destination, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  process.stdout.write(JSON.stringify({
    shardIndex: result.shardIndex,
    shardCount: result.shardCount,
    chapters: result.chapters,
    totalBytes: result.totalBytes,
    totalDurationSeconds: result.totalDurationSeconds,
    output: destination,
  }) + '\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}

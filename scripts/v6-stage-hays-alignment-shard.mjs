import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile, rm, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

import { validateHaysAudioInventory } from './v6-hays-source-inventory.mjs';

const FETCH_ATTEMPTS = 4;
const CONCURRENCY = 4;

function fail(message) {
  throw new Error(message);
}

function keyOf(book, chapter) {
  return String(book).toUpperCase() + '-' + Number(chapter);
}

async function hashFile(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

async function sleep(ms) {
  await new Promise(resolvePromise => setTimeout(resolvePromise, ms));
}

async function fetchToFile(url, path, fetchImpl = globalThis.fetch) {
  let lastError = null;
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(120000),
        headers: {
          'user-agent': 'BibleQuest-V6-alignment-shard/1.0',
          accept: 'audio/mpeg,application/octet-stream;q=0.9,*/*;q=0.1',
        },
      });
      if (!response.ok || !response.body) throw new Error('HTTP ' + response.status + ' ' + response.statusText);
      await pipeline(Readable.fromWeb(response.body), createWriteStream(path));
      return;
    } catch (error) {
      lastError = error;
      await rm(path, { force: true });
      if (attempt < FETCH_ATTEMPTS) await sleep(1000 * (2 ** (attempt - 1)));
    }
  }
  fail('Could not download ' + url + ': ' + (lastError instanceof Error ? lastError.message : String(lastError)));
}

async function runPool(items, worker, concurrency = CONCURRENCY) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index], index);
    }
  });
  await Promise.all(runners);
}

export async function stageHaysAlignmentShard({
  inventory,
  worklist,
  outputDirectory,
  fetchImpl = globalThis.fetch,
} = {}) {
  const validation = validateHaysAudioInventory(inventory, { requireComplete: true });
  if (!validation.valid) fail('Exact Hays inventory is invalid: ' + validation.issues.join('; '));
  if (!worklist || worklist.translationId !== 'bsb' || !Array.isArray(worklist.chapters)
    || worklist.audioInventorySha256 !== inventory.inventorySha256
    || worklist.audioContentVersion !== inventory.contentVersion) {
    fail('Alignment worklist does not match the exact Hays inventory.');
  }
  const root = resolve(outputDirectory);
  await mkdir(root, { recursive: true });
  const inventoryByKey = new Map(inventory.files.map(row => [keyOf(row.book, row.chapter), row]));
  let totalBytes = 0;

  await runPool(worklist.chapters, async item => {
    const key = keyOf(item.book, item.chapter);
    const canonical = inventoryByKey.get(key);
    if (!canonical || canonical.filename !== item.filename || canonical.sourceUrl !== item.sourceUrl
      || canonical.sha256 !== item.sha256 || canonical.byteLength !== item.byteLength) {
      fail('Alignment worklist source identity mismatch for ' + key + '.');
    }
    const target = join(root, canonical.filename);
    await fetchToFile(canonical.sourceUrl, target, fetchImpl);
    const details = await stat(target);
    if (!details.isFile() || details.size !== canonical.byteLength) {
      await rm(target, { force: true });
      fail('Downloaded Hays byte length mismatch for ' + key + '.');
    }
    const sha256 = await hashFile(target);
    if (sha256 !== canonical.sha256) {
      await rm(target, { force: true });
      fail('Downloaded Hays checksum mismatch for ' + key + '.');
    }
    totalBytes += details.size;
  });

  return Object.freeze({
    shard: worklist.shard,
    shardCount: worklist.shardCount,
    chapters: worklist.chapters.length,
    totalBytes,
    audioInventorySha256: inventory.inventorySha256,
    audioContentVersion: inventory.contentVersion,
  });
}

async function main(argv) {
  const [inventoryPath, worklistPath, outputDirectory] = argv;
  if (argv.length !== 3) {
    fail('Usage: node scripts/v6-stage-hays-alignment-shard.mjs <inventory.json> <worklist.json> <output-dir>');
  }
  const [inventory, worklist] = await Promise.all([
    readFile(resolve(inventoryPath), 'utf8').then(JSON.parse),
    readFile(resolve(worklistPath), 'utf8').then(JSON.parse),
  ]);
  const result = await stageHaysAlignmentShard({ inventory, worklist, outputDirectory });
  process.stdout.write(JSON.stringify(result) + '\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}

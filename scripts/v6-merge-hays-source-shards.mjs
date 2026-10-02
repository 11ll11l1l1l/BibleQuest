import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  computeHaysAudioInventoryDigest,
  expectedHaysAudioFiles,
  validateHaysAudioInventory,
} from './v6-hays-source-inventory.mjs';

const SOURCE_BASE_URL = 'https://openbible.com/audio/hays/';
const SOURCE_LABEL = 'OpenBible Barry Hays';

function fail(message) {
  throw new Error(message);
}

function assertPartial(partial) {
  if (!partial || partial.schemaVersion !== 1
    || partial.translationId !== 'bsb'
    || partial.narrator !== 'Barry Hays'
    || partial.source !== SOURCE_LABEL
    || partial.sourceBaseUrl !== SOURCE_BASE_URL
    || !Number.isSafeInteger(partial.shardIndex)
    || !Number.isSafeInteger(partial.shardCount)
    || partial.shardCount < 1
    || partial.shardIndex < 1
    || partial.shardIndex > partial.shardCount
    || !Array.isArray(partial.files)
    || partial.files.length !== partial.chapters) {
    fail('Invalid Hays source shard manifest.');
  }
}

export function mergeHaysSourceShardInventories(partials) {
  if (!Array.isArray(partials) || !partials.length) fail('Hays source shard manifests are required.');
  partials.forEach(assertPartial);
  const shardCount = partials[0].shardCount;
  if (partials.length !== shardCount) {
    fail('Expected exactly ' + shardCount + ' Hays source shard manifests; received ' + partials.length + '.');
  }
  const shardIndexes = new Set();
  for (const partial of partials) {
    if (partial.shardCount !== shardCount) fail('Hays source shard-count mismatch.');
    if (shardIndexes.has(partial.shardIndex)) fail('Duplicate Hays source shard ' + partial.shardIndex + '.');
    shardIndexes.add(partial.shardIndex);
  }
  for (let index = 1; index <= shardCount; index += 1) {
    if (!shardIndexes.has(index)) fail('Missing Hays source shard ' + index + '.');
  }

  const expected = expectedHaysAudioFiles();
  const order = new Map(expected.map((row, index) => [row.book + '-' + row.chapter, index]));
  const rowsByKey = new Map();
  for (const partial of partials) {
    for (const row of partial.files) {
      const key = String(row?.book ?? '').toUpperCase() + '-' + Number(row?.chapter);
      if (!order.has(key)) fail('Unexpected Hays source chapter ' + key + '.');
      if (rowsByKey.has(key)) fail('Duplicate Hays source chapter ' + key + '.');
      rowsByKey.set(key, row);
    }
  }
  if (rowsByKey.size !== expected.length) {
    fail('Complete Hays source inventory requires all 1,189 chapters; received ' + rowsByKey.size + '.');
  }

  const files = [...rowsByKey.entries()]
    .sort((left, right) => order.get(left[0]) - order.get(right[0]))
    .map(([, row]) => Object.freeze({ ...row }));

  let totalBytes = 0;
  let totalDurationSeconds = 0;
  for (const row of files) {
    totalBytes += Number(row.byteLength);
    totalDurationSeconds += Number(row.durationSeconds);
  }
  if (!Number.isSafeInteger(totalBytes) || totalBytes < 1) fail('Merged Hays source byte total is invalid.');

  const digest = computeHaysAudioInventoryDigest(files);
  const inventory = Object.freeze({
    schemaVersion: 1,
    translationId: 'bsb',
    narrator: 'Barry Hays',
    source: SOURCE_LABEL,
    sourceBaseUrl: SOURCE_BASE_URL,
    chapters: files.length,
    totalBytes,
    totalDurationSeconds: Number(totalDurationSeconds.toFixed(6)),
    inventorySha256: digest,
    contentVersion: 'sha256-' + digest,
    files: Object.freeze(files),
  });
  const validation = validateHaysAudioInventory(inventory, { requireComplete: true });
  if (!validation.valid) {
    fail('Merged Hays source inventory failed validation: ' + validation.issues.join('; ') + '.');
  }
  return inventory;
}

export async function loadHaysSourceShardDirectory(directory) {
  const root = resolve(directory);
  const names = (await readdir(root))
    .filter(name => /^bsb-hays-source-shard-\d+\.json$/.test(name))
    .sort();
  if (!names.length) fail('No Hays source shard manifests were found in ' + root + '.');
  const partials = [];
  for (const name of names) {
    partials.push(JSON.parse(await readFile(join(root, name), 'utf8')));
  }
  return Object.freeze(partials);
}

async function main(argv) {
  const [directory, outputPath] = argv;
  if (!directory || !outputPath || argv.length !== 2) {
    fail('Usage: node scripts/v6-merge-hays-source-shards.mjs <shard-dir> <inventory-output.json>');
  }
  const partials = await loadHaysSourceShardDirectory(directory);
  const inventory = mergeHaysSourceShardInventories(partials);
  const destination = resolve(outputPath);
  await writeFile(destination, JSON.stringify(inventory, null, 2) + '\n', { flag: 'wx' });
  process.stdout.write(JSON.stringify({
    chapters: inventory.chapters,
    totalBytes: inventory.totalBytes,
    totalDurationSeconds: inventory.totalDurationSeconds,
    inventorySha256: inventory.inventorySha256,
    contentVersion: inventory.contentVersion,
    output: destination,
  }) + '\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}

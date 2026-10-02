import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateHaysAudioInventory } from './v6-hays-source-inventory.mjs';

const EXPECTED_CHAPTERS = 1189;

function fail(message) {
  throw new Error(message);
}

function chapterKey(book, chapter) {
  return String(book).toUpperCase() + '-' + Number(chapter);
}

export function buildBsbAlignmentCiShards({ plan, reusePlan, inventory, shardCount = 16 } = {}) {
  if (!plan || plan.schemaVersion !== 2 || plan.translationId !== 'bsb' || plan.expectedChapters !== EXPECTED_CHAPTERS) {
    fail('Exact BSB regeneration plan is required.');
  }
  if (!reusePlan || reusePlan.translationId !== 'bsb' || reusePlan.expectedChapters !== EXPECTED_CHAPTERS
    || !Array.isArray(reusePlan.regenerate)) {
    fail('Exact BSB reuse plan is required.');
  }
  const validation = validateHaysAudioInventory(inventory, { requireComplete: true });
  if (!validation.valid) fail('Exact Hays inventory is invalid: ' + validation.issues.join('; '));
  if (inventory.inventorySha256 !== plan.audioInventorySha256
    || inventory.inventorySha256 !== reusePlan.audioInventorySha256
    || inventory.contentVersion !== plan.audioContentVersion
    || inventory.contentVersion !== reusePlan.audioContentVersion) {
    fail('Plan, reuse plan, and Hays inventory identities do not match.');
  }
  if (!Number.isSafeInteger(shardCount) || shardCount < 1 || shardCount > 32) {
    fail('Alignment CI shard count must be an integer from 1 through 32.');
  }
  if (reusePlan.reusableChapters + reusePlan.regenerateChapters !== EXPECTED_CHAPTERS
    || reusePlan.regenerate.length !== reusePlan.regenerateChapters) {
    fail('Reuse plan chapter accounting is inconsistent.');
  }

  const byKey = new Map(inventory.files.map(row => [chapterKey(row.book, row.chapter), row]));
  const items = reusePlan.regenerate.map(row => {
    const key = chapterKey(row.book, row.chapter);
    const audio = byKey.get(key);
    if (!audio) fail('Exact Hays inventory is missing regeneration chapter ' + key + '.');
    return Object.freeze({
      book: String(row.book).toUpperCase(),
      chapter: Number(row.chapter),
      filename: audio.filename,
      sourceUrl: audio.sourceUrl,
      sha256: audio.sha256,
      byteLength: audio.byteLength,
      durationSeconds: audio.durationSeconds,
    });
  }).sort((left, right) =>
    right.durationSeconds - left.durationSeconds
    || left.book.localeCompare(right.book)
    || left.chapter - right.chapter);

  const shards = Array.from({ length: shardCount }, (_, index) => ({
    shard: index + 1,
    totalDurationSeconds: 0,
    totalBytes: 0,
    chapters: [],
  }));

  for (const item of items) {
    shards.sort((left, right) =>
      left.totalDurationSeconds - right.totalDurationSeconds
      || left.chapters.length - right.chapters.length
      || left.shard - right.shard);
    const target = shards[0];
    target.chapters.push(item);
    target.totalDurationSeconds += item.durationSeconds;
    target.totalBytes += item.byteLength;
  }
  shards.sort((left, right) => left.shard - right.shard);

  return Object.freeze({
    schemaVersion: 1,
    translationId: 'bsb',
    scriptureContentVersion: plan.scriptureContentVersion,
    audioContentVersion: plan.audioContentVersion,
    audioInventorySha256: plan.audioInventorySha256,
    alignmentRevision: plan.alignmentRevision,
    reusableChapters: reusePlan.reusableChapters,
    regenerateChapters: reusePlan.regenerateChapters,
    shardCount,
    shards: Object.freeze(shards.map(shard => Object.freeze({
      shard: shard.shard,
      chapters: Object.freeze(shard.chapters),
      chapterCount: shard.chapters.length,
      totalDurationSeconds: Number(shard.totalDurationSeconds.toFixed(6)),
      totalBytes: shard.totalBytes,
    }))),
  });
}

async function main(argv) {
  const [planPath, reusePath, inventoryPath, shardCountRaw, outputDirectory] = argv;
  if (argv.length !== 5) {
    fail('Usage: node scripts/v6-plan-bsb-alignment-ci-shards.mjs <regeneration-plan.json> <reuse-plan.json> <inventory.json> <shard-count> <output-dir>');
  }
  const [plan, reusePlan, inventory] = await Promise.all([
    readFile(resolve(planPath), 'utf8').then(JSON.parse),
    readFile(resolve(reusePath), 'utf8').then(JSON.parse),
    readFile(resolve(inventoryPath), 'utf8').then(JSON.parse),
  ]);
  const result = buildBsbAlignmentCiShards({
    plan,
    reusePlan,
    inventory,
    shardCount: Number(shardCountRaw),
  });
  const root = resolve(outputDirectory);
  await mkdir(root, { recursive: true });
  await writeFile(join(root, 'index.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  for (const shard of result.shards) {
    const name = 'shard-' + String(shard.shard).padStart(2, '0') + '.json';
    await writeFile(join(root, name), JSON.stringify({
      schemaVersion: 1,
      translationId: 'bsb',
      scriptureContentVersion: result.scriptureContentVersion,
      audioContentVersion: result.audioContentVersion,
      audioInventorySha256: result.audioInventorySha256,
      alignmentRevision: result.alignmentRevision,
      shard: shard.shard,
      shardCount: result.shardCount,
      chapterCount: shard.chapterCount,
      totalDurationSeconds: shard.totalDurationSeconds,
      totalBytes: shard.totalBytes,
      chapters: shard.chapters,
    }, null, 2) + '\n', { flag: 'wx' });
  }
  process.stdout.write(JSON.stringify({
    reusableChapters: result.reusableChapters,
    regenerateChapters: result.regenerateChapters,
    shardCount: result.shardCount,
    minShardDurationSeconds: Math.min(...result.shards.map(row => row.totalDurationSeconds)),
    maxShardDurationSeconds: Math.max(...result.shards.map(row => row.totalDurationSeconds)),
  }) + '\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}

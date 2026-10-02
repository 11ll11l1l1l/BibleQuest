import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { prepareBsbAlignmentRegeneration } from './v6-prepare-bsb-alignment-regeneration.mjs';
import { validateHaysAudioInventory } from './v6-hays-source-inventory.mjs';

function fail(message) {
  throw new Error(message);
}

export async function prepareBsbAlignmentFromInventory({
  alignerDirectory,
  inventoryPath,
  audioDirectory,
  workspaceDirectory,
} = {}) {
  if (![alignerDirectory, inventoryPath, audioDirectory, workspaceDirectory].every(value => typeof value === 'string' && value.trim())) {
    fail('Pinned aligner, inventory, audio placeholder, and workspace paths are required.');
  }
  const inventory = JSON.parse(await readFile(resolve(inventoryPath), 'utf8'));
  const validation = validateHaysAudioInventory(inventory, { requireComplete: true });
  if (!validation.valid) fail('Exact Hays inventory is invalid: ' + validation.issues.join('; '));
  await mkdir(resolve(audioDirectory), { recursive: true });

  return prepareBsbAlignmentRegeneration({
    alignerDirectory,
    audioDirectory,
    workspaceDirectory,
    audioInventoryResolver: async () => inventory,
  });
}

async function main(argv) {
  const [alignerDirectory, inventoryPath, audioDirectory, workspaceDirectory] = argv;
  if (argv.length !== 4) {
    fail('Usage: node scripts/v6-prepare-bsb-alignment-from-inventory.mjs <pinned-bsb-align-dir> <inventory.json> <audio-placeholder-dir> <empty-workspace>');
  }
  const plan = await prepareBsbAlignmentFromInventory({
    alignerDirectory,
    inventoryPath,
    audioDirectory,
    workspaceDirectory,
  });
  process.stdout.write(JSON.stringify({
    scriptureContentVersion: plan.scriptureContentVersion,
    textInventorySha256: plan.textInventorySha256,
    audioContentVersion: plan.audioContentVersion,
    audioInventorySha256: plan.audioInventorySha256,
    alignmentRevision: plan.alignmentRevision,
    expectedChapters: plan.expectedChapters,
    workspaceDirectory: plan.workspaceDirectory,
  }) + '\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}

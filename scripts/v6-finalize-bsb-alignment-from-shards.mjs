import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { inspectBsbAlignmentRegeneration } from './v6-prepare-bsb-alignment-regeneration.mjs';
import {
  buildBsbAlignmentImportCommand,
  buildBsbRegenerationFinalizeInputs,
} from './v6-run-bsb-alignment-regeneration.mjs';
import { validateBsbAlignmentManifest } from './v6-bsb-alignment-manifest.mjs';
import { validateHaysAudioInventory } from './v6-hays-source-inventory.mjs';

function fail(message) {
  throw new Error(message);
}

export async function finalizeBsbAlignmentFromShards({
  plan,
  inventory,
  root = process.cwd(),
} = {}) {
  if (!plan || plan.schemaVersion !== 2 || plan.translationId !== 'bsb') {
    fail('Exact BSB regeneration plan is required.');
  }
  const validation = validateHaysAudioInventory(inventory, { requireComplete: true });
  if (!validation.valid) fail('Exact Hays inventory is invalid: ' + validation.issues.join('; '));
  if (inventory.inventorySha256 !== plan.audioInventorySha256
    || inventory.contentVersion !== plan.audioContentVersion) {
    fail('Exact Hays inventory does not match the regeneration plan.');
  }

  const generation = await inspectBsbAlignmentRegeneration(plan);
  if (!generation.complete || generation.generatedChapters !== 1189) {
    fail('BSB alignment shards are incomplete: generated=' + generation.generatedChapters
      + ', missing=' + generation.missing.length + ', unexpected=' + generation.unexpected.length + '.');
  }

  const finalize = buildBsbRegenerationFinalizeInputs(plan, inventory);
  await writeFile(finalize.metadataPath, JSON.stringify(finalize.metadata, null, 2) + '\n', { flag: 'wx' });
  await writeFile(finalize.durationsPath, JSON.stringify(finalize.durations, null, 2) + '\n', { flag: 'wx' });

  const command = buildBsbAlignmentImportCommand(plan, finalize, { root });
  execFileSync(command.executable, command.args, { cwd: command.cwd, stdio: 'inherit' });

  const manifest = JSON.parse(await readFile(finalize.candidateManifestPath, 'utf8'));
  const manifestValidation = validateBsbAlignmentManifest(manifest, {
    requireComplete: true,
    audioContentVersion: plan.audioContentVersion,
    audioInventorySha256: plan.audioInventorySha256,
    scriptureContentVersion: plan.scriptureContentVersion,
  });
  if (!manifestValidation.valid
    || manifest.alignmentRevision !== plan.alignmentRevision
    || manifest.chapterCount !== 1189) {
    fail('Final BSB alignment manifest failed exact validation: ' + manifestValidation.issues.join('; '));
  }

  return Object.freeze({
    chapterCount: manifest.chapterCount,
    verseCount: manifest.verseCount,
    audioContentVersion: manifest.audioContentVersion,
    audioInventorySha256: manifest.audioInventorySha256,
    scriptureContentVersion: manifest.scriptureContentVersion,
    alignmentContentVersion: manifest.alignmentContentVersion,
    alignmentRevision: manifest.alignmentRevision,
    inventorySha256: manifest.inventorySha256,
    manifestPath: finalize.candidateManifestPath,
    rowsPath: finalize.alignmentRowsPath,
  });
}

async function main(argv) {
  const [planPath, inventoryPath] = argv;
  if (argv.length !== 2) {
    fail('Usage: node scripts/v6-finalize-bsb-alignment-from-shards.mjs <regeneration-plan.json> <inventory.json>');
  }
  const [plan, inventory] = await Promise.all([
    readFile(resolve(planPath), 'utf8').then(JSON.parse),
    readFile(resolve(inventoryPath), 'utf8').then(JSON.parse),
  ]);
  const result = await finalizeBsbAlignmentFromShards({ plan, inventory });
  process.stdout.write(JSON.stringify(result) + '\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}

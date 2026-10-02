import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateHaysAudioInventory } from './v6-hays-source-inventory.mjs';

function fail(message) {
  throw new Error(message);
}

export async function materializeHaysRuntimeSource({
  inventoryPath,
  outputPath,
  expectedInventorySha256,
}) {
  if (!inventoryPath || !outputPath) fail('Hays runtime-source materialization requires input and output paths.');
  const input = resolve(inventoryPath);
  const output = resolve(outputPath);
  const inventory = JSON.parse(await readFile(input, 'utf8'));
  const validation = validateHaysAudioInventory(inventory, { requireComplete: true });
  if (!validation.valid) fail('Certified Hays source inventory is invalid: ' + validation.issues.join('; '));
  if (expectedInventorySha256 && inventory.inventorySha256 !== expectedInventorySha256) {
    fail('Certified Hays source inventory digest mismatch.');
  }
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(inventory, null, 2) + '\n', 'utf8');
  return Object.freeze({
    chapters: inventory.chapters,
    totalBytes: inventory.totalBytes,
    inventorySha256: inventory.inventorySha256,
    contentVersion: inventory.contentVersion,
    output,
  });
}

async function main(argv) {
  const [inventoryPath, outputPath, expectedInventorySha256] = argv;
  if (!inventoryPath || !outputPath || argv.length > 3) {
    fail('Usage: node scripts/v6-materialize-hays-runtime-source.mjs <inventory.json> <output.json> [expected-inventory-sha256]');
  }
  const result = await materializeHaysRuntimeSource({ inventoryPath, outputPath, expectedInventorySha256 });
  process.stdout.write(JSON.stringify(result) + '\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}

import { readFileSync } from 'node:fs';
import { localization, getMissingLocaleKeys } from '../src/app/localization.js';
import { parseV7ContentBundle } from '../src/v7/content/contract.js';
import { buildV7ContentReleaseEvidence } from '../src/v7/content/release-evidence.js';

const candidateSha = process.argv[2];
if (!candidateSha) {
  console.error('Usage: node scripts/v7-content-release-evidence.mjs <40-character-candidate-sha>');
  process.exit(2);
}

const bundlePaths = [
  '../data/v7/books/representative-catalog.json',
  '../content/v7/devotionals/spurgeon-samples.json',
  '../data/v7/past-teachings/prayer-source-example.json'
];

const items = bundlePaths.flatMap(relativePath => {
  const bundle = JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
  return parseV7ContentBundle(bundle).items;
});
const v7Keys = localization.keyInventory.filter(key => key.startsWith('v7.'));
const missingV7KeysByLocale = Object.fromEntries(localization.supportedLocales.map(locale => [
  locale,
  getMissingLocaleKeys(locale).filter(key => key.startsWith('v7.'))
]));

const report = buildV7ContentReleaseEvidence({
  candidateSha,
  items,
  supportedLocales: localization.supportedLocales,
  v7KeyCount: v7Keys.length,
  missingV7KeysByLocale
});

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

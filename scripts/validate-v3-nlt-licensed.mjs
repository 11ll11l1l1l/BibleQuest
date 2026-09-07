import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const fail = message => { console.error(`NLT licensed-link architecture validation FAILED: ${message}`); process.exit(1); };
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const bible = read('src/core/bible.js');
const reader = read('src/app/reader.js');
const ui = read('src/features/reader/index.js');

for (const contract of [
  "id: 'nlt'",
  "mode: 'licensed-link'",
  "externalVersion: 'NLT'",
  'BibleQuest does not redistribute the NLT text',
  'licensedPassage',
  "translation.mode === 'licensed-link'",
  'verses: Object.freeze([])',
  'external licensed-reader mode and does not expose Scripture packs',
  'search stays in the licensed external reader'
]) if (!bible.includes(contract)) fail(`Bible service missing NLT contract: ${contract}`);

for (const contract of [
  "translation.mode === 'licensed-link'",
  'cannot mark unseen Scripture text as read'
]) if (!reader.includes(contract)) fail(`Reader owner missing NLT safety contract: ${contract}`);

for (const contract of [
  'data-licensed-reader',
  'data-nlt-open',
  'Open NLT in a licensed reader',
  'does not redistribute its full text',
  'data-licensed-search-note'
]) if (!ui.includes(contract)) fail(`Reader UI missing NLT presentation contract: ${contract}`);

if (/biblegateway\.com|version=NLT|fetch\s*\(|localStorage|sessionStorage|MutationObserver|window\.BQ/.test(ui)) fail('Reader UI must not own NLT URL construction, networking, storage, or legacy globals.');
if (/biblegateway\.com|version=NLT/.test(reader)) fail('Reader state owner must not construct the NLT licensed-reader URL.');

const sourceFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name).replaceAll('\\', '/');
    if (entry.isDirectory()) walk(rel);
    else if (entry.name.endsWith('.js')) sourceFiles.push(rel);
  }
}
walk('src');
const nltUrlOwners = sourceFiles.filter(file => /biblegateway\.com/.test(read(file)) && /NLT|externalVersion/.test(read(file)));
if (nltUrlOwners.length !== 1 || nltUrlOwners[0] !== 'src/core/bible.js') fail(`NLT external URL ownership leaked outside src/core/bible.js: ${nltUrlOwners.join(', ') || 'none'}`);

console.log('BibleQuest v3 NLT licensed-link architecture validation passed.');

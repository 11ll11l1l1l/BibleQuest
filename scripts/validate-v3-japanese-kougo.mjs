import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const fail = message => { console.error(`Japanese Kougo architecture validation FAILED: ${message}`); process.exit(1); };
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const bible = read('src/core/bible.js');
const reader = read('src/app/reader.js');
const ui = read('src/features/reader/index.js');
const asyncUi = read('src/v5/reader/async-view.mjs');

for (const contract of [
  "id: 'jko'",
  "mode: 'live-kougo'",
  "bundled: false",
  'api.getbible.net/v2/japkougo/${bookNumber}/${chapterNumber}.json',
  'book.index + 1',
  "translation.mode === 'live-kougo'",
  'does not expose bundled book packs',
  'text search is unavailable because this translation is loaded live one chapter at a time',
  'moral rights remain',
  'Scripture text displayed without modification'
]) if (!bible.includes(contract)) fail(`Bible service missing required Japanese contract: ${contract}`);

const sourceFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name).replaceAll('\\', '/');
    if (entry.isDirectory()) walk(rel);
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) sourceFiles.push(rel);
  }
}
walk('src');
const remoteOwners = sourceFiles.filter(file => read(file).includes('api.getbible.net'));
if (remoteOwners.length !== 1 || remoteOwners[0] !== 'src/core/bible.js') fail(`GetBible source ownership leaked outside src/core/bible.js: ${remoteOwners.join(', ') || 'none'}`);

for (const contract of ["translation === 'jko'", "reader.setTranslation('bsb')"]) {
  if (!ui.includes(contract)) fail(`Reader route owner missing Japanese recovery behavior: ${contract}`);
}
for (const contract of ['data-jko-failure', 'data-reader-use-bsb', '本文を推測したり別の訳で置き換えたりしません']) {
  if (!asyncUi.includes(contract)) fail(`Reader async component missing Japanese recovery presentation: ${contract}`);
}
if (!ui.includes("import { renderReaderError, renderReaderLoading } from '../../v5/reader/async-view.mjs';")) fail('Reader route must import the characterized async presentation boundary.');
if (!ui.includes("renderReaderError(error, { japanese: reader.getState().translation === 'jko' })")) fail('Reader route must pass explicit Japanese state into the async error component.');
if (!ui.includes('renderReaderLoading(message)')) fail('Reader route must delegate loading presentation to the async component.');
if (/api\.getbible\.net|fetch\s*\(|localStorage|sessionStorage|MutationObserver|window\.BQ/.test(ui)) fail('Reader UI must not own Japanese networking/storage/global runtime behavior.');
if (/api\.getbible\.net|fetch\s*\(|localStorage|sessionStorage|MutationObserver|window\.BQ/.test(asyncUi)) fail('Reader async component must remain networking/storage/global-runtime independent.');
if (!reader.includes('bible.loadChapter')) fail('Reader service must continue delegating Scripture loading to the Bible service.');
if (/api\.getbible\.net|japkougo/.test(reader)) fail('Reader state owner must not know the Japanese remote implementation.');

console.log('BibleQuest v3 Japanese Kougo architecture validation passed.');

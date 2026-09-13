import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const validator = spawnSync(process.execPath, ['scripts/validate-v4-cebocb-packs.mjs'], {
  cwd: root,
  encoding: 'utf8'
});
assert.equal(
  validator.status,
  0,
  `Current-head CEBOCB canonical validator failed:\n${validator.stdout}\n${validator.stderr}`
);
assert.match(validator.stdout, /CEBOCB pack validation passed/i);

const bible = read('src/core/bible.js');
const readerService = read('src/app/reader.js');
const readerPage = read('src/features/reader/index.js');
const smoke = read('tests/v4-cebocb-reader-smoke.mjs');

assert.match(bible, /cebocb:\s*Object\.freeze\(\{\s*id:\s*'cebocb'/, 'CEBOCB must remain registered in the central Bible owner.');
assert.match(bible, /label:\s*'Cebuano\/Bisaya\s*·\s*OCCB'/, 'Reader label must still expose Cebuano/Bisaya · OCCB.');
assert.match(bible, /folder:\s*'cebuano'/, 'CEBOCB must still resolve to bundled Cebuano packs.');
assert.match(bible, /mode:\s*'bundled'/, 'CEBOCB must remain bundled rather than becoming a remote runtime source.');
assert.ok(readerService.includes('verseEnd'), 'Reader service must preserve CEBOCB bridge ranges.');
assert.ok(readerPage.includes('verseEnd'), 'Reader UI must preserve CEBOCB bridge-range presentation.');

for (const contract of [
  "reader.setTranslation('cebocb')",
  "reader.setBook('GEN',1)",
  "result.selectedLabel==='Cebuano/Bisaya · OCCB'",
  "result.bridgeLabel==='17–18'",
  "result.duplicate18===false",
  "result.peekReference==='Genesis 1:17–18'",
  "result.searchReference==='Genesis 1:17–18'",
  "result.sourceText.includes('CC BY-SA 4.0')",
  "result.metrics.innerWidth===390"
]) {
  assert.ok(smoke.includes(contract), `Existing CEBOCB browser smoke lost required behavior contract: ${contract}`);
}

console.log('BibleQuest V5 CEBOCB current-head preservation contract passed.');

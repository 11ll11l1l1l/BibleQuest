import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const failures = [];
const fail = message => failures.push(message);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));

for (const file of [
  'src/core/bible.js',
  'src/app/reader.js',
  'src/features/reader/index.js',
  'src/features/reader/context.js',
  'src/ui/context-lab.css',
  'tests/v3-step-context-edge.mjs',
  'tests/v3-step-context-smoke.mjs',
  'data/packs/context/manifest.json'
]) if (!exists(file)) fail(`Missing STEPBible Context Lab contract file: ${file}`);

for (const file of ['src/core/bible.js','src/app/reader.js','src/features/reader/index.js','src/features/reader/context.js']) {
  if (!exists(file)) continue;
  try { execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' }); }
  catch (error) { fail(`Syntax check failed for ${file}: ${error.stderr?.toString() || error.message}`); }
}

if (exists('src/core/bible.js')) {
  const bible = read('src/core/bible.js');
  for (const contract of ['lexicalContext', 'data/packs/context/manifest.json', 'meta.path', 'STEPBible TBESH/TBESG', 'CC BY 4.0']) {
    if (!bible.includes(contract)) fail(`Bible data owner missing Context Lab contract: ${contract}`);
  }
}

if (exists('src/app/reader.js')) {
  const reader = read('src/app/reader.js');
  for (const contract of ['bible.lexicalContext', "bible.loadChapter('bsb'"]) {
    if (!reader.includes(contract)) fail(`Reader owner missing Context Lab delegation contract: ${contract}`);
  }
  if (/data\/packs\/context\//.test(reader)) fail('Reader must not address context-pack paths directly.');
}

if (exists('src/features/reader/context.js')) {
  const ui = read('src/features/reader/context.js');
  for (const forbidden of [
    /\bfetch\s*\(/,
    /\b(localStorage|sessionStorage)\b/,
    /progress\.record/,
    /createClient\s*\(/,
    /MutationObserver/,
    /window\.BQ[A-Z0-9_]*/,
    /data\/packs\/context\//
  ]) if (forbidden.test(ui)) fail(`Context Lab UI bypasses an owner boundary: ${forbidden}`);
  for (const contract of ['reader.contextChapter', 'reader.lexicalContext', 'data-context-ref', 'Three rules for a safer word study']) {
    if (!ui.includes(contract)) fail(`Context Lab UI missing verified contract: ${contract}`);
  }
}

if (exists('src/features/reader/index.js')) {
  const readerUi = read('src/features/reader/index.js');
  if (!readerUi.includes("createContextLab")) fail('Reader UI must compose the Context Lab presentation component.');
  if (!readerUi.includes('dataset.peekVerse')) fail('Verse Peek must use namespaced peek-verse metadata.');
  if (/dataset\.verse\s*=/.test(readerUi)) fail('Verse Peek dialog must not reuse the Scripture button data-verse selector.');
}

for (const file of ['src/app/reader.js','src/features/reader/index.js','src/features/reader/context.js']) {
  if (exists(file) && /data\/packs\/context\//.test(read(file))) fail(`Context pack ownership leaked outside Bible service: ${file}`);
}

if (exists('index.html') && !read('index.html').includes('src/ui/context-lab.css')) fail('index.html must load the isolated Context Lab stylesheet.');

if (failures.length) {
  console.error(`BibleQuest v3 STEPBible Context Lab architecture validation FAILED (${failures.length})`);
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}
console.log('BibleQuest v3 STEPBible Context Lab architecture validation passed.');

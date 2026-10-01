import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { exportCurrentBsbAlignmentText } from '../../scripts/v6-export-current-bsb-alignment-text.mjs';
import { SCRIPTURE_PACKAGE_SOURCES, buildScripturePackageManifest } from '../../scripts/v6-generate-scripture-manifests.mjs';

const root = process.cwd();
const bsb = SCRIPTURE_PACKAGE_SOURCES.find(source => source.translationId === 'bsb');
assert.ok(bsb, 'BSB package source must be configured');
const current = buildScripturePackageManifest(root, bsb);
const output = await mkdtemp(join(tmpdir(), 'bq-v6-bsb-export-'));

try {
  const exported = await exportCurrentBsbAlignmentText({ root, outputDirectory: output });
  assert.equal(exported.translationId, 'bsb');
  assert.equal(exported.scriptureContentVersion, current.contentVersion);
  assert.equal(exported.books, 66);
  assert.equal(exported.chapters, 1189);
  assert.equal(exported.files.length, 1189);

  const acts8 = exported.files.find(row => row.book === 'ACT' && row.chapter === 8);
  assert.ok(acts8, 'Acts 8 must be exported');
  assert.equal(acts8.requiresVerseRemap, true);
  assert.ok(acts8.verseNumbers.includes(26));
  assert.ok(!acts8.verseNumbers.includes(37), 'canonical omitted verse must remain omitted');

  const sourceRows = JSON.parse(await readFile(join(root, 'data', 'packs', bsb.folder, 'ACT.json'), 'utf8'))
    .filter(row => row.c === 8)
    .sort((a, b) => a.v - b.v);
  const exportedText = await readFile(join(output, acts8.filename), 'utf8');
  assert.equal(exportedText, `${sourceRows.map(row => row.t).join('\n')}\n`);
  assert.deepEqual(acts8.verseNumbers, sourceRows.map(row => row.v));

  const manifest = JSON.parse(await readFile(join(output, '_biblequest-bsb-alignment-export.json'), 'utf8'));
  assert.equal(manifest.scriptureContentVersion, current.contentVersion);
  assert.equal(manifest.inventorySha256, exported.inventorySha256);
  assert.deepEqual(manifest.files.find(row => row.book === 'ACT' && row.chapter === 8).verseNumbers, acts8.verseNumbers);

  await assert.rejects(
    exportCurrentBsbAlignmentText({ root, outputDirectory: output }),
    /must be empty/,
    're-export into a populated directory must fail closed',
  );
} finally {
  await rm(output, { recursive: true, force: true });
}

console.log('PASS v6 current BSB alignment export identity');

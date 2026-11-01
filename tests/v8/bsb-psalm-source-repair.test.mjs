import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createBibleDataService} from '../../src/core/bible.js';
const folder = 'data/source-repairs/bsb-psalm-127/';
const source = JSON.parse(readFileSync(folder + 'SOURCE.json'));
const bytes = readFileSync(folder + 'PSA_127_BSB.txt');
const lines = bytes.toString('utf8').trimEnd().split('\n');
const fetcher = async path => ({ok: true, json: async () => JSON.parse(readFileSync(path))});

test('source-backed delivery repair matches the same pinned revision and its complete chapter', () => {
  assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sourceSha256);
  assert.equal(createHash('sha256').update(readFileSync(folder + 'LICENSE-CC0.md')).digest('hex'), source.licenseSha256);
  const rows = JSON.parse(readFileSync('data/packs/bible/PSA.json')).filter(r => r.c === 127);
  assert.deepEqual(rows.map(r => r.v), [1,2,3,4,5]);
  assert.deepEqual(rows.map(r => r.t), lines);
});

test('actual BSB provider reads and searches repaired verse online and from offline package storage', async () => {
  const cache = new Map();
  const packStore = {read: async path => cache.get(path), write: async (path, value) => {cache.set(path, value); return true;}};
  const bible = createBibleDataService({fetcher, packStore});
  assert.equal((await bible.loadChapter('bsb','PSA',127)).verses[0].text, lines[0]);
  const result = await bible.search('bsb','Psalm 127:1');
  assert.equal(result.results[0].text, lines[0]);
  const offline = createBibleDataService({fetcher: async () => {throw Error('offline');}, packStore});
  assert.equal((await offline.loadChapter('bsb','PSA',127)).verses[0].text, lines[0]);
});

test('delivery generator repairs exactly one missing address and rejects conflicting source text', () => {
  execFileSync('python', ['-c', `
import json,sys
from pathlib import Path
sys.path.insert(0,'scripts')
from bsb_source_repairs import apply_bsb_source_repairs
rows=[dict(row,b='PSA',id=f"PSA.{row['c']}.{row['v']}",s=[]) for row in json.loads(Path('data/packs/bible/PSA.json').read_text())]
assert apply_bsb_source_repairs(rows,Path('.'))==rows
missing=[r for r in rows if not(r['c']==127 and r['v']==1)]
assert apply_bsb_source_repairs(missing,Path('.'))==rows
conflict=[dict(r,t='incorrect') if r['c']==127 and r['v']==2 else r for r in missing]
try: apply_bsb_source_repairs(conflict,Path('.'))
except ValueError: pass
else: raise AssertionError('Conflicting source text accepted')
`]);
});

test('repaired audio ranges retain exact certified audio and match all five verse word boundaries', () => {
  const metadata = source.alignment;
  const wordsBytes = readFileSync(folder + metadata.wordsPath);
  assert.equal(createHash('sha256').update(wordsBytes).digest('hex'), metadata.wordsSha256);
  const words = JSON.parse(wordsBytes);
  const manifest = JSON.parse(readFileSync('data/v6-audio/bsb-hays-alignment.json'));
  const chapter = manifest.chapters.find(row => row.book === 'PSA' && row.chapter === 127);
  assert.equal(chapter.audioSha256, metadata.audioSha256);
  assert.equal(chapter.audioByteLength, metadata.audioBytes);
  assert.equal(chapter.durationSeconds, metadata.audioDurationSeconds);
  assert.equal(chapter.scriptureContentVersion, metadata.scriptureContentVersion);
  assert.deepEqual(chapter.verses.map(row => row.verse), [1,2,3,4,5]);
  for (const verse of chapter.verses) {
    const row = words.verses[String(verse.verse)];
    assert.equal(verse.startSeconds, row[0].start);
    assert.equal(verse.endSeconds, row.at(-1).end);
  }
});

test('alignment repair is reproducible and refuses reuse when any previous text identity changes', async () => {
  const {repairPsalmAlignment} = await import('../../scripts/v8-repair-bsb-psalm-alignment.mjs');
  const {buildBsbAlignmentManifest} = await import('../../scripts/v6-bsb-alignment-manifest.mjs');
  const current = JSON.parse(readFileSync('data/v6-audio/bsb-hays-alignment.json'));
  const metadata = source.alignment;
  const originalChapter = current.chapters.find(row => row.book === 'PSA' && row.chapter === 127);
  const previousPsalms = JSON.stringify(JSON.parse(readFileSync('data/packs/bible/PSA.json')).filter(r => !(r.c === 127 && r.v === 1))) + '\n';
  assert.equal(createHash('sha256').update(previousPsalms).digest('hex'), source.previousDeliverySha256);
  const previousManifest = buildBsbAlignmentManifest({
    alignments: current.chapters.map(row => ({...row, scriptureContentVersion:metadata.previousScriptureContentVersion, ...(row.book === 'PSA' && row.chapter === 127 ? {verses:metadata.previousPsalmVerses} : {})})),
    metadata:{translationId:'bsb',source:originalChapter.source,license:originalChapter.license,alignmentSource:'BSB-publishing/bsb-align',alignmentRevision:metadata.revision,contentVersion:current.audioContentVersion},
    scriptureContentVersion:metadata.previousScriptureContentVersion, audioInventorySha256:current.audioInventorySha256,complete:true,
  });
  assert.equal(previousManifest.inventorySha256, metadata.previousInventorySha256);
  const wordOutput = JSON.parse(readFileSync(folder + metadata.wordsPath));
  assert.deepEqual(repairPsalmAlignment({previousPsalms,previousManifest,wordOutput}).manifest, current);
  assert.throws(() => repairPsalmAlignment({previousPsalms:previousPsalms.replace('In vain','Changed'),previousManifest,wordOutput}), /add only|source-proven/);
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const bible = fs.readFileSync(new URL('../../src/core/bible.js', import.meta.url), 'utf8');

test('V5 Reader translation delivery and licensing boundaries are characterized before migration', () => {
  assert.match(bible, /bsb: Object\.freeze\([\s\S]*?bundled: true, mode: 'bundled'[\s\S]*?Public-domain \/ CC0 browser source/);
  assert.match(bible, /tl: Object\.freeze\([\s\S]*?bundled: true, mode: 'bundled'[\s\S]*?CC BY-SA 4\.0/);
  assert.match(bible, /cebocb: Object\.freeze\([\s\S]*?bundled: true, mode: 'bundled'[\s\S]*?CC BY-SA 4\.0/);
  assert.match(bible, /jko: Object\.freeze\([\s\S]*?bundled: false, mode: 'live-kougo'/);
  assert.match(bible, /nlt: Object\.freeze\([\s\S]*?bundled: false, mode: 'licensed-link'/);
});

test('V5 opened-pack cache remains Reader-owned and search does not bulk-persist scanned books', () => {
  assert.match(bible, /OFFLINE_PACK_CACHE = 'biblequest-v3-opened-bible-packs-v1'/);
  assert.match(bible, /loadBook\(translation\.id, book\.code, \{ persistOffline: false \}\)/);
});

test('V5 Reader preserves navigation and reference-search semantics', () => {
  assert.match(bible, /function parseReference\(input\)/);
  assert.match(bible, /BOOK_ALIASES\.get\(normalizeBookToken/);
  assert.match(bible, /type: 'reference'/);
  assert.match(bible, /type: 'text'/);
  assert.match(bible, /Search by Bible reference instead/);
});

test('V5 Reader keeps licensed translations external instead of exposing Scripture packs', () => {
  assert.match(bible, /licensed-reader mode and does not expose Scripture packs/);
  assert.match(bible, /BibleQuest does not redistribute the NLT text/);
  assert.match(bible, /https:\/\/www\.biblegateway\.com\/passage/);
});

test('V5 Context Lab keeps lexical data bounded and exposes unavailable states', () => {
  assert.match(bible, /async function lexicalContext\(code, chapter, verse\)/);
  assert.match(bible, /available: false, reason:/);
  assert.match(bible, /entries: Object\.freeze\(entries\)/);
  assert.match(bible, /Brief lexical fields only; not an interlinear or theological interpretation/);
  assert.match(bible, /STEPBible TBESH\/TBESG/);
  assert.match(bible, /CC BY 4\.0/);
});

test('V5 Reader service boundary exposes chapter, search, context and external-link owners', () => {
  assert.match(bible, /return Object\.freeze\(\{[\s\S]*?loadBook,[\s\S]*?loadChapter,[\s\S]*?licensedPassage,[\s\S]*?lexicalContext,[\s\S]*?parseReference,[\s\S]*?search,[\s\S]*?externalLinks,/);
});

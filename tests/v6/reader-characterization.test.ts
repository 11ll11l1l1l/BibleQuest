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

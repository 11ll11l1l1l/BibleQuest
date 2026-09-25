import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gamesPaths = [
  path.join(repoRoot, 'src/features/games/index.js'),
  path.join(repoRoot, 'src/features/games/views/launcher-memory.js'),
  path.join(repoRoot, 'src/features/games/views/same-room.js'),
];
const readGamesSurface=async()=>{const parts=[];for(const file of gamesPaths)parts.push(await readFile(file,'utf8'));return parts.join('\n')};

const mappings = [
  {
    id: 'memory-meadow-mark',
    asset: 'assets/v4/games/game-memory-meadow.png',
    legacy: '<div class="bq-memory-mark" aria-hidden="true">🦊</div>',
    wired: /<div class="bq-memory-mark"[^>]*>\s*<img[^>]+assets\/v4\/games\/game-memory-meadow\.png/i,
  },
  {
    id: 'memory-meadow-result-medal',
    asset: 'assets/v4/games/game-memory-meadow.png',
    legacy: '<div class="bq-game-medal" aria-hidden="true">🦊</div>',
    wired: /<div class="bq-game-medal"[^>]*>\s*<img[^>]+assets\/v4\/games\/game-memory-meadow\.png/i,
  },
  {
    id: 'character-detective-mark',
    asset: 'assets/v4/games/game-character-detective.png',
    legacy: '<div class="bq-detective-mark" aria-hidden="true">🕵️</div>',
    wired: /<div class="bq-detective-mark"[^>]*>\s*<img[^>]+assets\/v4\/games\/game-character-detective\.png/i,
  },
  {
    id: 'recall-library-book-mark',
    asset: 'assets/v4/games/game-recall-deck.png',
    legacy: '<span class="bq-recall-icon" aria-hidden="true">📘</span>',
    wired: /<span class="bq-recall-icon"[^>]*>\s*<img[^>]+assets\/v4\/games\/game-recall-deck\.png/i,
  },
];

test('Phase 3 Games genuine-match artwork assets exist', async () => {
  for (const mapping of mappings) {
    await assert.doesNotReject(access(path.join(repoRoot, mapping.asset)), `${mapping.id}: expected genuine-match asset ${mapping.asset}`);
  }
});

test('Phase 3 Games HUD markers stay on an explicit legacy-or-wired migration path', async () => {
  const source = await readGamesSurface();
  for (const mapping of mappings) {
    const stillLegacy = source.includes(mapping.legacy);
    const wired = mapping.wired.test(source);
    assert.equal(Number(stillLegacy) + Number(wired), 1, `${mapping.id}: expected exactly one recognized presentation: legacy emoji or its genuine-match asset`);
  }
});

test('Phase 3 Games mapping does not pretend unmatched reward glyphs have assets', async () => {
  const source = await readGamesSurface();
  assert.match(source, /stars earned/);
  assert.match(source, /coins earned/);
  assert.match(source, /⭐/);
  assert.match(source, /🪙/);
});

test('decorative migration markers stay accessibility-independent', async () => {
  const source = await readGamesSurface();
  for (const mapping of mappings) {
    if (source.includes(mapping.legacy)) assert.match(mapping.legacy, /aria-hidden="true"/, `${mapping.id}: decorative legacy marker must remain hidden from accessibility tree`);
  }
  assert.match(source, /aria-label="Memory Meadow cards"/);
  assert.match(source, /<h1>Memory Meadow<\/h1>/);
  assert.match(source, /<h1>Who am I\?<\/h1>/);
});

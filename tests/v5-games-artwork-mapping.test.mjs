import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gamesPath = path.join(repoRoot, 'src/features/games/index.js');

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
    await assert.doesNotReject(
      access(path.join(repoRoot, mapping.asset)),
      `${mapping.id}: expected genuine-match asset ${mapping.asset}`,
    );
  }
});

test('Phase 3 Games HUD markers stay on an explicit legacy-or-wired migration path', async () => {
  const source = await readFile(gamesPath, 'utf8');

  for (const mapping of mappings) {
    const stillLegacy = source.includes(mapping.legacy);
    const wired = mapping.wired.test(source);
    assert.equal(
      Number(stillLegacy) + Number(wired),
      1,
      `${mapping.id}: expected exactly one recognized presentation: legacy emoji or its genuine-match asset`,
    );
  }
});

test('Phase 3 Games mapping does not pretend unmatched reward glyphs have assets', async () => {
  const source = await readFile(gamesPath, 'utf8');

  // No honest star/coin image exists in assets/v4/games today. Keep these visible
  // reward glyphs out of the genuine-match migration contract instead of forcing
  // an unrelated asset solely to remove emoji.
  assert.match(source, /stars earned/);
  assert.match(source, /coins earned/);
  assert.match(source, /⭐/);
  assert.match(source, /🪙/);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const [solo, recall, memory, css] = await Promise.all([
  readFile(new URL('../../src/features/games/views/solo.js', import.meta.url), 'utf8'),
  readFile(new URL('../../src/features/games/views/recall.js', import.meta.url), 'utf8'),
  readFile(new URL('../../src/features/games/views/launcher-memory.js', import.meta.url), 'utf8'),
  readFile(new URL('../../src/ui/games-art-final-v4.css', import.meta.url), 'utf8'),
]);

test('Games decorative result and Recall marks use intentional assets instead of raw emoji', () => {
  assert.doesNotMatch(solo, /[🏆🌟🌱]/u);
  assert.doesNotMatch(recall, /[🧠🗃]/u);
  assert.match(solo, /game-winner-trophy\.png/);
  assert.equal((recall.match(/game-recall-deck\.png/g) ?? []).length >= 3, true);
  assert.match(solo, /aria-hidden="true"><img[^>]+alt="">/);
  assert.match(recall, /aria-hidden="true"><img[^>]+alt="">/);
});

test('semantic Games glyphs remain text where they convey meaning', () => {
  assert.match(solo, /📖/u);
  assert.match(recall, /📖/u);
  assert.match(memory, /⭐/u);
  assert.match(memory, /🪙/u);
});

test('explicit decorative images own sizing without duplicate CSS artwork', () => {
  assert.match(css, /\[data-recall-question\] \.bq-recall-mark > img/);
  assert.match(css, /\[data-game-complete\] \.bq-game-medal > img/);
  assert.match(css, /object-fit:contain/);
  assert.match(css, /\[data-game-complete\] \.bq-game-medal \{\n  background-image:none;/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>readFile(path.join(root,rel),'utf8');

const animals=Object.freeze([
  ['🦊','fox'],['🐼','panda'],['🐸','frog'],['🐵','monkey'],
  ['🦁','lion'],['🐰','rabbit'],['🐯','tiger'],['🐨','koala']
]);

const exactAssets=Object.freeze([
  'assets/v4/games/game-memory-meadow.png',
  'assets/v4/games/game-character-detective.png',
  'assets/v4/games/game-recall-deck.png',
  'assets/v4/games/game-timeline.png',
  'assets/v4/games/game-winner-trophy.png',
  'assets/v4/memory-meadow/memory-card-back.png',
  'assets/v4/memory-meadow/memory-all-friends.png',
  'assets/v4/memory-meadow/memory-complete-medal.png',
  'assets/v4/memory-meadow/reward-star.png',
  'assets/v4/memory-meadow/reward-coin.png',
  ...animals.map(([,name])=>`assets/v4/memory-meadow/memory-${name}.png`)
]);

test('Games reviewed genuine-match artwork files exist on the candidate',async()=>{
  for(const asset of exactAssets) await assert.doesNotReject(access(path.join(root,asset)),`missing genuine Games asset: ${asset}`);
});

test('Memory Meadow card faces and HUD use exact existing artwork without changing state identity',async()=>{
  const [memory,css,finalCss]=await Promise.all([
    read('src/features/games/memory.js'),read('src/ui/v4-custom-art.css'),read('src/ui/games-art-final-v4.css')
  ]);
  for(const [glyph,name] of animals){
    assert.ok(memory.includes(`'${glyph}'`),`Memory state identity ${glyph} changed`);
    assert.ok(css.includes(`[aria-label*="${glyph}"] > span { background-image:url("../../assets/v4/memory-meadow/memory-${name}.png"); }`),`${name} card face is not mapped to its exact asset`);
  }
  assert.match(css,/\.bq-memory-card > span\s*\{[^}]*font-size:0 !important;/s,'Memory emoji token must not be the normal visual card face');
  assert.ok(css.includes('memory-card-back.png'),'hidden Memory cards must use the dedicated card-back art');
  assert.ok(css.includes('game-memory-meadow.png'),'Memory Meadow HUD mark must use its dedicated game art');
  assert.ok(css.includes('memory-complete-medal.png'),'Memory completion medal must use its dedicated art');
  assert.ok(css.includes('reward-star.png')&&css.includes('reward-coin.png'),'Memory rewards must have exact star/coin artwork');
  assert.ok(finalCss.includes('Do not replace textual Scripture-reference'),'Games final layer must keep semantic-text exceptions explicit rather than force unrelated artwork');
});

test('Detective, Recall, Timeline and round-result chrome use purpose-matched existing assets',async()=>{
  const [css,finalCss,games]=await Promise.all([
    read('src/ui/v4-custom-art.css'),read('src/ui/games-art-final-v4.css'),Promise.all([read('src/features/games/index.js'),read('src/features/games/views/launcher-memory.js'),read('src/features/games/views/same-room.js'),read('src/features/games/views/challenges.js'),read('src/features/games/views/recall.js'),read('src/features/games/views/solo.js')]).then(parts=>parts.join('\n'))
  ]);
  assert.match(css,/\.bq-detective-mark,\s*\.bq-recall-icon,\s*\.bq-memory-mark\s*\{[^}]*font-size:0 !important;/s,'decorative Detective/Recall/Memory legacy tokens must be hidden by the shared art layer');
  assert.match(css,/\.bq-detective-mark\s*\{[^}]*game-character-detective\.png/s);
  assert.match(css,/\.bq-recall-icon\s*\{[^}]*game-recall-deck\.png/s);
  assert.ok(css.includes('game-timeline.png'),'Timeline must use its dedicated artwork');
  assert.match(finalCss,/\[data-recall-question\] \.bq-recall-mark\s*\{[^}]*font-size:0 !important;[^}]*game-recall-deck\.png/s);
  assert.match(finalCss,/\[data-recall-complete\] \.bq-game-medal\s*\{[^}]*game-recall-deck\.png/s);
  assert.match(finalCss,/\[data-game-complete\] \.bq-game-medal\s*\{[^}]*game-winner-trophy\.png/s);
  assert.ok(games.includes('aria-hidden="true">🕵️</div>'),'Detective legacy token must remain explicitly decorative under the CSS artwork layer');
  assert.ok(games.includes('class="bq-recall-icon" aria-hidden="true">📘</span>'),'Recall legacy token must remain explicitly decorative under the CSS artwork layer');
});

test('remaining Games glyphs are semantic labels/fallback tokens, not falsely claimed artwork matches',async()=>{
  const [games,finalCss]=await Promise.all([Promise.all([read('src/features/games/index.js'),read('src/features/games/views/launcher-memory.js'),read('src/features/games/views/same-room.js'),read('src/features/games/views/challenges.js'),read('src/features/games/views/recall.js'),read('src/features/games/views/solo.js')]).then(parts=>parts.join('\n')),read('src/ui/games-art-final-v4.css')]);
  for(const glyph of ['📖','⭐','🪙']) assert.ok(games.includes(glyph),`expected reviewed semantic Games label ${glyph}`);
  assert.ok(games.includes('aria-label="Move ${escapeHtml(event)} up"')&&games.includes('aria-label="Move ${escapeHtml(event)} down"'),'Timeline direction remains independently labelled');
  assert.ok(finalCss.includes('@media (forced-colors: active)'),'decorative artwork must retain an explicit forced-colors treatment');
  assert.ok(games.includes('stars earned')&&games.includes('coins earned'),'reward meaning must remain present as text independent of custom reward art');
});

console.log('V5 Phase 3 Games artwork certification: PASS');

import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('src/ui/games-art-final-v4.css','utf8');
const games=fs.readFileSync('src/features/games/index.js','utf8');

assert.ok(html.includes('<link rel="stylesheet" href="src/ui/games-art-final-v4.css">'),'final Games artwork stylesheet must load');
assert.ok(html.indexOf('src/ui/games-art-final-v4.css')>html.indexOf('src/ui/v4-custom-art.css'),'final Games artwork layer must load after prior custom-art wiring');

const requiredAssets=[
  'assets/v4/games/game-recall-deck.png',
  'assets/v4/games/game-winner-trophy.png',
  'assets/v4/games/game-scoreboard.png',
  'assets/v4/games/game-clue.png'
];
for(const asset of requiredAssets){
  assert.ok(fs.existsSync(asset),`missing Games artwork asset: ${asset}`);
  assert.ok(css.includes(asset.replace('assets/v4/','../../assets/v4/')),`Games final stylesheet must reference ${asset}`);
}

for(const selector of [
  '[data-recall-question] .bq-recall-mark',
  '[data-recall-complete] .bq-game-medal',
  '[data-game-complete] .bq-game-medal',
  '[data-same-room-complete]::before',
  '.bq-game-explanation[data-game-feedback]::before',
  '.bq-game-explanation[data-same-room-feedback]::before',
  '.bq-game-explanation[data-detective-feedback]::before',
  '.bq-game-explanation[data-timeline-feedback]::before'
]) assert.ok(css.includes(selector),`missing final Games artwork selector: ${selector}`);

assert.ok(css.includes('@media (forced-colors: active)'),'Games art must retain a forced-colors fallback');
assert.ok(css.includes('@media (max-width:520px)'),'Games art must retain a phone-size treatment');

// This tranche is intentionally presentation-only. Lock the stateful renderer
// byte-for-byte to the audited V4 head so timers, scoring, persistence, Memory
// behavior and interaction hooks cannot drift under an artwork change.
const prefix=Buffer.from(`blob ${Buffer.byteLength(games)}\0`);
const blobSha=crypto.createHash('sha1').update(prefix).update(games).digest('hex');
assert.equal(blobSha,'161497e031923f8adf92062ca88e7c826a1ea8c9','Games renderer changed during presentation-only artwork tranche');

for(const hook of [
  'data-game-launch',
  'data-memory-index',
  'data-same-room-answer',
  'data-detective-form',
  'data-timeline-move',
  'data-recall-rate',
  'data-game-answer'
]) assert.ok(games.includes(hook),`protected Games interaction hook missing: ${hook}`);

console.log('V4 final Games artwork static contract: PASS');

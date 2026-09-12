// BibleQuest V4 Games + Avatar Vault visual-kit contract. Both tranches are
// deliberately CSS-only, matching the Reader precedent: games/index.js is a
// single phase-based render function with ~15 phases and dozens of data-*
// hooks; avatar-vault/index.js already has real SVG art and its own
// established Play-family identity from an earlier Phase-B pass. Neither
// file's markup/logic was touched.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const games = fs.readFileSync(path.join(root, 'src', 'features', 'games', 'index.js'), 'utf8');
const avatarVault = fs.readFileSync(path.join(root, 'src', 'features', 'avatar-vault', 'index.js'), 'utf8');
const gamesCss = fs.readFileSync(path.join(root, 'src', 'ui', 'games-v4.css'), 'utf8');
const avatarCss = fs.readFileSync(path.join(root, 'src', 'ui', 'avatar-vault-v4.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.ok(index.includes('href="src/ui/games-v4.css"'), 'games-v4.css must be linked from index.html.');
assert.ok(index.includes('href="src/ui/avatar-vault-v4.css"'), 'avatar-vault-v4.css must be linked from index.html.');

function assertByteExact(label, current, filePath) {
  let baseline = null;
  try {
    baseline = execFileSync('git', ['show', `release/v4-reader:${filePath}`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch { /* baseline ref unavailable in this checkout (shallow clone) - hooks below still enforced */ }
  if (baseline !== null) {
    assert.equal(current, baseline, `${label} tranche is scoped to CSS only - ${filePath} must be byte-for-byte unchanged from the prior certified checkpoint.`);
  }
}
assertByteExact('Games', games, 'src/features/games/index.js');
assertByteExact('Avatar Vault', avatarVault, 'src/features/avatar-vault/index.js');

// Spot-check critical Games interaction hooks remain present (defense in
// depth alongside the byte-exact check above).
for (const hook of ['data-game-launch', 'data-game-launcher', 'data-game-home', 'data-memory-open', 'data-memory-index', 'data-same-room-open', 'data-detective-form', 'data-timeline-move', 'data-recall-reveal', 'data-recall-rate']) {
  assert.ok(games.includes(hook), `Games must preserve the existing interaction hook: ${hook}`);
}
for (const hook of ['data-avatar-style', 'data-avatar-select', 'data-avatar-back', 'data-avatar-art']) {
  assert.ok(avatarVault.includes(hook), `Avatar Vault must preserve the existing interaction hook: ${hook}`);
}

// Games: key surfaces must be retokenized onto the certified V4 foundation.
for (const rule of ['.bq-game-card{border-color:var(--line-200)', '.bq-question-card{box-shadow:var(--shadow-1)', '.bq-game-choice.is-correct{border-color:color-mix(in srgb,var(--success)']) {
  assert.ok(gamesCss.includes(rule), `Games visual kit is missing expected V4 token usage: ${rule}`);
}
// Non-color-only: correct/wrong answer states must keep a background-color
// change AND their own left/right context (the A/B/C letter span, unchanged
// in markup) rather than color alone.
assert.ok(games.includes("String.fromCharCode(65+index)"), 'Answer choices must keep their letter labels (non-color-only correctness signal).');

// Avatar Vault: foundation shadow tokens layered on top of its existing
// Phase-B identity without replacing that identity.
assert.ok(avatarCss.includes('box-shadow:var(--shadow'), 'Avatar Vault visual alignment must use certified V4 shadow tokens.');
assert.ok(avatarVault.includes('bq-avatar-art'), 'Avatar Vault must keep its existing real SVG art system, not revert to emoji.');

console.log('BibleQuest v4 Games + Avatar Vault visual-kit contract passed.');

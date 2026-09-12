// BibleQuest V4 Reader editorial typography contract. This tranche is
// deliberately CSS-only: src/features/reader/index.js's markup is tightly
// coupled to click/change-delegation handlers across dozens of data-*
// hooks, so no logic/markup change was made. This test locks in that
// boundary and the typography improvement itself.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const reader = fs.readFileSync(path.join(root, 'src', 'features', 'reader', 'index.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'ui', 'reader-v4.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.ok(index.includes('href="src/ui/reader-v4.css"'), 'reader-v4.css must be linked from index.html.');

// Every reader interaction hook must be completely untouched by this
// tranche (Rule 1 + the CSS-only scope decision recorded for this gate).
for (const hook of [
  'data-reader-translation', 'data-reader-book', 'data-reader-chapter', 'data-reader-prev', 'data-reader-next',
  'data-reader-context', 'data-reader-mark', 'data-verse', 'data-reader-search', 'data-search-result',
  'data-verse-dialog', 'data-context-dialog', 'data-peek-context', 'data-verse-close', 'data-jp-vocab-toggle',
  'data-licensed-reader', 'data-nlt-open', 'data-reader-retry', 'data-reader-use-bsb', 'data-reader-message'
]) {
  assert.ok(reader.includes(hook), `Reader must preserve the existing interaction hook untouched: ${hook}`);
}

// This gate is verified against a known-good baseline: reader/index.js's
// byte content must be identical to the certified pre-tranche version.
let baselineHash = null;
try {
  baselineHash = execFileSync('git', ['show', 'release/v4-learn:src/features/reader/index.js'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
} catch { /* baseline ref unavailable in this checkout - skip the exact-match check, hooks above still enforced */ }
if (baselineHash !== null) {
  assert.equal(reader, baselineHash, 'Reader tranche is scoped to CSS only - src/features/reader/index.js must be byte-for-byte unchanged from the prior certified checkpoint.');
}

// Typography: Scripture text must use the display/serif role and a larger,
// more readable size than ordinary UI copy, using certified foundation tokens.
assert.ok(/\.bq-verse p\{font-family:var\(--font-display\)/.test(css), 'Verse text must use the Scripture/display typography role.');
assert.ok(/\.bq-peek-text\{font-family:var\(--font-display\)/.test(css), 'Verse-peek dialog text must use the Scripture/display typography role.');
const verseFontSize = parseFloat((css.match(/\.bq-verse p\{[^}]*font-size:([\d.]+)px/) || [])[1] || '0');
assert.ok(verseFontSize >= 16, `Verse text size must be at least 16px for reading comfort, found ${verseFontSize}px.`);

// Non-color-only: the highlighted-verse state must keep its inset box-shadow
// marker, not rely on background color alone.
assert.ok(/\.bq-verse\.is-highlighted\{[^}]*box-shadow:inset/.test(css), 'Highlighted verse state must not rely on background color alone.');

console.log('BibleQuest v4 Reader editorial typography contract passed.');

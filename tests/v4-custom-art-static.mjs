// BibleQuest V4 custom artwork contract (acceptance checklist Section F).
//
// Guards three failure modes found while wiring this tranche:
//   1. A referenced asset file that does not exist (silent broken image).
//   2. A `background-image` longhand painted onto a surface whose existing
//      certified styling uses a `background:` gradient - which would silently
//      erase that gradient.
//   3. Custom art wired onto a surface a previously-certified tranche
//      deliberately styled another way.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const cssPath = path.join(root, 'src', 'ui', 'v4-custom-art.css');
const css = fs.readFileSync(cssPath, 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.ok(index.includes('href="src/ui/v4-custom-art.css"'), 'v4-custom-art.css must be linked from index.html.');

// --- 1. Every referenced asset must exist on disk -----------------------
const referenced = [...new Set([...css.matchAll(/url\("\.\.\/\.\.\/(assets\/v4\/[^"]+)"\)/g)].map(m => m[1]))];
assert.ok(referenced.length >= 60, `Expected the artwork bridge to wire a substantial number of assets, found ${referenced.length}.`);
const missing = referenced.filter(rel => !fs.existsSync(path.join(root, rel)));
assert.deepEqual(missing, [], `Custom-art CSS references asset files that do not exist: ${missing.join(', ')}`);

// --- 2. Art must not be painted onto gradient-backed surfaces ----------
// .bq-learning-card carries `background:linear-gradient(...)` in reader.css and
// [data-more-*] panels carry certified per-tile gradients in
// more-visual-polish.css. Art on those surfaces must use a pseudo-element or
// an inner wrapper, never a background-image on the surface itself.
const gradientBacked = [
  { selector: '.bq-learning-card', note: 'reader.css sets a card gradient' },
  { selector: '[data-more-workspace]', note: 'more-visual-polish.css sets a per-tile gradient' },
  { selector: '[data-more-congregation]', note: 'more-visual-polish.css sets a per-tile gradient' }
];
for (const { selector, note } of gradientBacked) {
  // Find declaration blocks whose selector list ends at this exact element
  // (i.e. not a descendant like `[data-more-x] .bq-more-icon-wrap`) and that
  // set background-image directly.
  const re = new RegExp(`${selector.replace(/[.[\]]/g, ch => '\\' + ch)}(?:\\[[^\\]]*\\])?\\s*\\{[^}]*background-image\\s*:`, 'g');
  const hits = css.match(re) || [];
  assert.deepEqual(hits, [], `Custom art must not set background-image directly on ${selector} (${note}); use ::after or an inner icon wrapper instead.`);
}

// Learn-card art must go through ::after.
assert.ok(/\.bq-learning-card\[data-open-study\]::after\s*\{/.test(css), 'Learn card art must be layered via ::after, not the card background.');
// More-hub art must go through the existing icon wrapper.
assert.ok(/\[data-more-workspace\]\s+\.bq-more-icon-wrap\s*\{[^}]*background-image/.test(css), 'More hub art must target .bq-more-icon-wrap, not the panel.');

// --- 3. Bible World region icons stay on the certified numbered-step design
assert.ok(!/\[data-world-region="[a-z]+"\]/.test(css), 'Bible World region icons are intentionally left on the certified journey-v4 numbered-step treatment; custom art must not be wired onto them.');
assert.ok(/DELIBERATELY NOT wired/.test(css), 'The Bible World exclusion must stay documented inline so it is not silently reversed later.');

// --- 4. Every overlay that hides an inline SVG must restore it in forced colors
const forcedColorsBlocks = (css.match(/@media \(forced-colors: active\)/g) || []).length;
assert.ok(forcedColorsBlocks >= 4, `Each art overlay that hides an inline icon must restore it under forced-colors; found only ${forcedColorsBlocks} forced-colors blocks.`);

// --- 5. Avatar Vault: all 16 style ids must be covered ------------------
const avatarIds = ['starter','sakura','lantern','flame','crown','scholar','scroll','shepherd','couple','community','world','kitsune','moon','fuji','tea','lock'];
for (const id of avatarIds) {
  assert.ok(css.includes(`[data-avatar-art="${id}"]`), `Avatar Vault custom art is missing style id: ${id}`);
}

console.log('BibleQuest v4 custom artwork contract passed.');

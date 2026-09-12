// BibleQuest V4 Foundation static contract. Foundation is Class B shared
// presentation: it may include layout/motion (unlike a decorative
// *-visual-polish.css layer) but must stay service/state agnostic and must
// not fork into a second design system alongside the retained V3 aliases.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const css = fs.readFileSync(path.join(root, 'src', 'ui', 'v4-foundation.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.ok(index.includes('href="src/ui/v4-foundation.css"'), 'v4-foundation.css must be linked from index.html.');

// Tokens: color, type, spacing, radius, motion, elevation, focus.
for (const token of [
  '--surface-base', '--surface-raised', '--forest-900', '--amber-600', '--ink-900',
  '--success', '--warning', '--danger', '--focus',
  '--font-ui', '--font-display',
  '--space-1', '--space-16',
  '--radius-xs', '--radius-pill',
  '--duration-fast', '--ease-standard',
  '--shadow-1', '--shadow-2',
  '--tap-target'
]) {
  assert.ok(css.includes(`${token}:`), `Foundation is missing required token: ${token}`);
}

// V3 compatibility aliases must be retained so pre-V4 routes keep working
// unmigrated while Foundation is adopted incrementally.
for (const alias of ['--green:var(--forest-700)', '--line:var(--line-200)', '--paper:var(--surface-raised)', '--muted:var(--ink-500)']) {
  assert.ok(css.includes(alias), `Foundation must retain the V3 compatibility alias: ${alias}`);
}

// Focus: every interactive element must get a visible, token-driven focus ring.
assert.ok(/:focus-visible\{outline:3px solid var\(--focus\)/.test(css), 'Foundation must define a global, token-driven :focus-visible treatment.');

// Motion: reduced-motion must be honored globally, not per-component.
assert.ok(/@media\(prefers-reduced-motion:reduce\)\{\s*\*/.test(css), 'Foundation must define a global prefers-reduced-motion override.');

// Contrast: a stronger-contrast mode must exist and must cover the new form/status primitives too.
assert.ok(/@media\(prefers-contrast:more\)/.test(css), 'Foundation must define a prefers-contrast:more path.');
assert.ok(/html\[data-bq-contrast="strong"\] \.bq-panel input/.test(css), 'Strong-contrast mode must also cover form controls, not just panels/nav.');

// Form controls: text-like inputs, textarea, select, checkbox/radio, disabled state.
for (const selector of ['input[type="text"]', 'input[type="date"]', 'textarea', 'select', 'input[type="checkbox"]', 'input[type="radio"]', ':disabled']) {
  assert.ok(css.includes(selector), `Foundation form controls are missing coverage for: ${selector}`);
}

// Status badges must never rely on color alone: each variant needs its own
// distinct glyph via ::before content, independent of its color.
const badgeVariants = { success: '2713', warning: '26A0', danger: '2715', info: '2139' };
for (const [variant, glyph] of Object.entries(badgeVariants)) {
  const re = new RegExp(`\\.bq-status-badge--${variant}::before\\{content:"\\\\${glyph}"`);
  assert.ok(re.test(css), `Status badge variant '${variant}' must carry its own distinct glyph (not color-only signaling).`);
}
const glyphs = Object.values(badgeVariants);
assert.equal(new Set(glyphs).size, glyphs.length, 'Every status badge variant must use a distinct glyph.');

// Foundation must not introduce a second icon/runtime system: no remote font/icon CDN.
assert.ok(!/url\(https?:/i.test(css), 'Foundation must not load remote fonts/assets (offline/PWA + privacy constraint).');

console.log('BibleQuest v4 Foundation static contract passed.');

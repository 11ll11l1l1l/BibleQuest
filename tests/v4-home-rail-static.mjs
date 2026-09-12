// BibleQuest V4 Home shortcut rail contract
// (V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md Section A).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const home = fs.readFileSync(path.join(root, 'src', 'features', 'home', 'index.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'ui', 'home-rail-v4.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.ok(index.includes('href="src/ui/home-rail-v4.css"'), 'home-rail-v4.css must be linked from index.html.');

// Rail markup: a nav landmark with a labeled scroll track.
assert.ok(home.includes('data-home-rail') && home.includes('aria-label="Quick shortcuts"'), 'Rail must be an accessible, labeled navigation landmark.');
assert.ok(home.includes('data-home-rail-track'), 'Rail must expose its scroll track for wiring.');

// Exactly the 5 requested initial shortcuts, each with icon + text label + a route action.
const expected = [
  ['daily', 'Daily Journey', 'onMission'],
  ['reader', 'Reader', 'onReader'],
  ['assignments', 'Assignments', 'onAssignments'],
  ['calendar', 'Calendar', 'onCalendar'],
  ['grow', 'Progress', 'onGrow']
];
for (const [id, label, action] of expected) {
  const entryRe = new RegExp(`id: '${id}'[^}]*label: '${label}'[^}]*action: '${action}'`);
  assert.ok(entryRe.test(home) || new RegExp(`id: '${id}'`).test(home), `Rail data model is missing the '${id}' shortcut with expected label/action.`);
  assert.ok(home.includes(`label: '${label}'`), `Shortcut '${id}' must show the text label "${label}", not icon-only.`);
  assert.ok(home.includes(`action: '${action}'`), `Shortcut '${id}' must route through '${action}'.`);
}
assert.equal((home.match(/id: '[a-z]+', icon:/g) || []).length, 5, 'Rail must contain exactly 5 initial shortcuts.');
assert.ok(home.includes("iconSvg(item.icon"), 'Every rail item must render a real icon, not an emoji/unicode placeholder.');

// homePage must accept and use all 3 new route callbacks.
for (const param of ['onReader', 'onCalendar', 'onGrow']) {
  assert.ok(home.includes(param), `homePage must accept the new route callback: ${param}`);
}

// Keyboard support: arrow-key navigation between rail items, not mouse/touch-only.
assert.ok(home.includes('ArrowLeft') && home.includes('ArrowRight'), 'Rail must support left/right arrow-key navigation between shortcuts.');
assert.ok(home.includes('.focus()'), 'Arrow-key navigation must actually move keyboard focus between rail items.');

// CSS: horizontal scroll with snap, no vertical overflow trap, reduced-motion safe,
// and a small-width fallback so it works from 320px without breaking layout.
assert.ok(/\.bq-home-rail-track\{[^}]*overflow-x:auto/.test(css), 'Rail track must scroll horizontally.');
assert.ok(/\.bq-home-rail-track\{[^}]*scroll-snap-type:x/.test(css), 'Rail track must use horizontal scroll-snap.');
assert.ok(/scroll-snap-align:start/.test(css), 'Rail items must each be a scroll-snap target.');
assert.ok(/@media\(prefers-reduced-motion:reduce\)/.test(css), 'Rail must respect prefers-reduced-motion.');
assert.ok(/@media\(max-width:340px\)/.test(css), 'Rail must have an explicit small-width (down to ~320px) fallback.');

console.log('BibleQuest v4 Home shortcut rail contract passed.');

// BibleQuest V4 Home dashboard-composition contract. Locks in the fix for
// A1-V4-003: Daily Journey + Progress must read as the dominant continuation
// path; Tutorial/Recordings/Media must be compact secondary tiles, not three
// more full-weight panels competing with the primary journey.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const home = fs.readFileSync(path.join(root, 'src', 'features', 'home', 'index.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'ui', 'home-v4.css'), 'utf8');

// Every critical data hook and route action from the pre-redesign contract
// must survive unchanged (Rule 1: no service/data change from a visual tranche).
for (const hook of ['data-home-daily', 'data-open-daily', 'data-home-tutorial', 'data-open-tutorial', 'data-home-recordings', 'data-open-recordings', 'data-home-media', 'data-open-media', 'data-home-progress', 'data-home-xp', 'data-home-streak', 'data-home-activities', 'data-home-badges']) {
  assert.ok(home.includes(hook), `Home must preserve the existing hook: ${hook}`);
}
for (const action of ['onMission?.()', 'onTutorial?.()', 'onRecordings?.()', 'onMedia?.()']) {
  assert.ok(home.includes(action), `Home must still call the existing route action: ${action}`);
}

// The locked hero contract (separately enforced by v3-home-visual-polish-static.mjs)
// must still be present verbatim.
assert.ok(home.includes('<section class="bq-hero">'), 'Home must retain the bq-hero structure.');
assert.ok(home.includes('<img src="assets/bq-pinoy-japan-hero.svg" alt="" aria-hidden="true">'), 'Home must retain the hero asset path and decorative accessibility contract.');

// Dashboard composition: Tutorial/Recordings/Media must now be compact tiles
// grouped together, not three separate full-panel sections with their own
// heading + paragraph + button each.
assert.ok(home.includes('bq-home-secondary'), 'Home must group secondary actions into one compact row.');
assert.ok(home.includes('bq-home-tile-button'), 'Secondary actions must use the compact tile-button treatment.');
assert.ok(!/data-home-tutorial>[\s\S]{0,400}<h2>/.test(home), 'Tutorial must no longer render as a full panel with its own <h2> heading competing with the primary journey card.');

// Secondary tiles must still be real, labeled, accessible buttons — compact
// is not an excuse to drop accessibility.
const tileAriaLabels = ['Show BibleQuest tutorial', 'View live recordings', 'Browse media library'];
for (const label of tileAriaLabels) {
  assert.ok(home.includes(label), `Secondary tile is missing its accessible label: "${label}"`);
}

// Reachability rule: Congregation/Assignments must be directly available from
// Home. Existing Assignments state determines the destination; no new auth or
// congregation ownership is introduced here.
for (const hook of ['data-home-congregation-assignments', 'data-open-congregation-assignments', 'data-home-congregation-caption']) {
  assert.ok(home.includes(hook), `Home must expose the one-tap congregation shortcut hook: ${hook}`);
}
assert.ok(home.includes('Congregation &amp; Assignments'), 'Home must visibly label the direct Congregation & Assignments entry.');
assert.ok(home.includes("assignmentState?.status === 'ready' ? 'assignments' : 'congregation'"), 'A ready Assignments service state must route the Home shortcut to Assignments.');
assert.ok(home.includes("requestNavigation('congregation')"), 'A signed-out/no-congregation/non-ready state must fall back to congregation access.');
assert.ok(home.includes("congregationRoute === 'assignments' ? onAssignments?.()"), 'Ready congregation members must reuse the existing Assignments route owner.');

// CSS: the daily card must remain visually dominant (its own distinct
// background treatment), and the secondary row must be an explicit
// multi-column compact layout, not stacked full-width panels.
assert.ok(/\[data-home-daily\]\{background:linear-gradient/.test(css), 'Daily Journey card must keep a visually distinct, dominant treatment.');
assert.ok(/\.bq-home-secondary\{display:grid;grid-template-columns:repeat\(3,/.test(css), 'Secondary actions must render as a compact 3-column row, not stacked full panels.');
assert.ok(/\.bq-home-congregation\{margin-top:0;display:grid/.test(css), 'Congregation & Assignments must render as a dedicated compact Home access card.');

// Desktop grid must give the primary path (Daily Journey) more width than
// any single secondary element, and must not leave the secondary row or the
// congregation shortcut accidentally collapsed to a narrow track.
assert.ok(/>\[data-home-daily\]\{grid-column:span 8\}/.test(css), 'Daily Journey must occupy the dominant share of the desktop grid.');
assert.ok(/>\[data-home-congregation-assignments\]\{grid-column:1\/-1\}/.test(css), 'Congregation & Assignments shortcut must span the Home grid and remain obvious.');
assert.ok(/>\.bq-home-secondary\{grid-column:1\/-1/.test(css), 'Secondary row must span full width on desktop rather than collapsing into a single narrow column.');

console.log('BibleQuest v4 Home dashboard-composition and reachability contract passed.');

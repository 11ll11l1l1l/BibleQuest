// BibleQuest V4 More hub grouping contract (V4_UI_ASSESSMENT_AND_TASKS.md
// Task 3.2). Locks in the fix for the flat 15-section scroll: sections are
// now organized into 5 labeled groups, with every existing hook and
// mount()-level event wiring completely unchanged.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const more = fs.readFileSync(path.join(root, 'src', 'features', 'more', 'index.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'ui', 'more-v4.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.ok(index.includes('href="src/ui/more-v4.css"'), 'more-v4.css must be linked from index.html.');

// All 15 original destinations and their route actions must survive exactly.
const hooks = [
  'data-open-workspace', 'data-open-notification-center', 'data-open-community', 'data-open-ministry-hub',
  'data-open-content-review', 'data-open-couples-family', 'data-open-couples-cloud', 'data-open-journey-groups',
  'data-open-team-center', 'data-open-accessibility', 'data-install-app', 'data-open-backup',
  'data-open-mission', 'data-open-calendar', 'data-open-congregation'
];
for (const hook of hooks) {
  assert.ok(more.includes(hook), `More must preserve the existing hook: ${hook}`);
}

// Grouping: 5 labeled categories, each containing the right destinations.
const groups = {
  ministry: ['data-more-ministry-hub', 'data-more-congregation', 'data-more-team-center', 'data-more-content-review', 'data-more-community'],
  planning: ['data-more-calendar', 'data-more-mission'],
  together: ['data-more-couples>', 'data-more-couples-cloud', 'data-more-journey-groups'],
  'workspace-inbox': ['data-more-workspace', 'data-more-notifications'],
  device: ['data-more-accessibility', 'data-more-backup', 'data-more-install']
};
for (const [group, members] of Object.entries(groups)) {
  const groupRe = new RegExp(`<div class="bq-more-group" data-more-group="${group}">([\\s\\S]*?)</div>`);
  const match = groupRe.exec(more);
  assert.ok(match, `Group '${group}' is missing from More.`);
  for (const member of members) {
    assert.ok(match[1].includes(member), `Group '${group}' is missing expected member: ${member}`);
  }
}
assert.equal((more.match(/data-more-group=/g) || []).length, 5, 'More must organize destinations into exactly 5 labeled groups.');
for (const label of ['MINISTRY &amp; CONGREGATION', 'PERSONAL PLANNING', 'TOGETHER', 'WORKSPACE &amp; INBOX', 'DEVICE &amp; SETTINGS']) {
  assert.ok(more.includes(label), `More is missing the expected group label: ${label}`);
}

// The mount() function - all event wiring - must be byte-for-byte identical
// to the pre-tranche baseline. Only the html template may have changed.
let baseline = null;
try {
  baseline = execFileSync('git', ['show', 'release/v4-games-avatar:src/features/more/index.js'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
} catch { /* baseline unavailable in shallow checkout - hook checks above still enforced */ }
if (baseline !== null) {
  const extractMount = source => source.slice(source.indexOf('mount(root)'));
  assert.equal(extractMount(more), extractMount(baseline), 'More hub grouping tranche must not touch mount() event-wiring logic - only the html template may change.');
}

console.log('BibleQuest v4 More hub grouping contract passed.');

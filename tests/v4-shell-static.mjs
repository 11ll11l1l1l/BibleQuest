// BibleQuest V4 Shell/Navigation static contract. Locks in what Foundation
// A/B already built (real icons, no dev/rebuild language, full nav/session/
// progress/recovery chrome) while allowing the approved V5 localization owner
// to supply visible labels instead of hard-coded English strings.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const shell = fs.readFileSync(path.join(root, 'src', 'ui', 'shell.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// No internal-rebuild/development language anywhere in the shell.
for (const banned of ['Rebuild v3', 'rebuild v3', 'REBUILD', 'WIP', 'work in progress', 'TODO', 'placeholder']) {
  assert.ok(!shell.includes(banned), `Shell must not contain internal-development language: "${banned}"`);
}

// No Unicode/emoji glyphs standing in for navigation iconography (the exact
// A1-V4-001/A1-V4-009 findings this gate is meant to close).
const bannedGlyphs = ['⌂', '▤', '◆', '◌', '⋯'];
for (const glyph of bannedGlyphs) {
  assert.ok(!shell.includes(glyph), `Shell must not use placeholder Unicode navigation glyphs: "${glyph}"`);
}
assert.ok(shell.includes("import { iconSvg } from './icons.js'"), 'Shell must render navigation/brand icons through the shared icon system, not inline glyphs.');

// V5 localizes shell chrome through the single localization owner. Brand and
// navigation identity must remain real labels, not a bare text mark or icons.
assert.ok(shell.includes("import { localization } from '../app/localization.js'"), 'Shell must use the integrated localization owner.');
assert.ok(shell.includes("text('app.name')"), 'Shell must render the localized BibleQuest app name.');
assert.ok(shell.includes("text('shell.brandHomeLabel')"), 'Shell brand control must retain an accessible localized name.');
assert.ok(!/>BQ<\/strong>/.test(shell), 'Shell must not fall back to a bare "BQ" text mark.');

// All five primary routes present, each wired to a stable localized label key.
for (const [route, key] of [['home','nav.home'], ['learn','nav.learn'], ['play','nav.play'], ['grow','nav.grow'], ['more','nav.more']]) {
  assert.ok(shell.includes(`'${route}'`) && shell.includes(`'${key}'`), `Shell navigation is missing the '${route}' route or its localized label key.`);
}
assert.ok(/aria-current/.test(shell), 'Shell must mark the active route with aria-current for assistive tech.');

// Session chrome: three distinguishable states, with the guest label supplied
// by localization rather than frozen to English source text.
for (const state of ['authenticated', 'guest', 'busy']) {
  assert.ok(shell.includes(`'${state}'`), `Shell session chip must define the '${state}' state.`);
}
assert.ok(shell.includes("sessionLabel.textContent = text('shell.guest')"), 'Guest state must have a localized text label, not be communicated by color/dot alone.');
assert.ok(shell.includes("text('shell.signingIn')") && shell.includes("text('shell.starting')"), 'Busy session states must retain localized text labels.');

// Progress chrome present and update-able.
assert.ok(shell.includes('data-progress-chip') && shell.includes('data-progress-xp') && shell.includes('data-progress-streak'), 'Shell must render an updatable progress chip (xp + streak).');
assert.ok(shell.includes("'shell.streak.one'") && shell.includes("'shell.streak.other'"), 'Shell streak text must remain localization-aware.');

// Recovery/error state: primary + secondary action, not a dead end.
assert.ok(shell.includes('data-recovery-retry') && shell.includes('data-recovery-home'), 'Shell recovery panel must offer both a retry and a way home.');
assert.ok(/role="alert"/.test(shell), 'Shell recovery panel must announce itself to assistive tech.');

// Single shell/runtime owner: exactly one mount guard, no second shell path.
assert.equal((shell.match(/data-bq-shell="v3"/g) || []).length, 2, 'Shell must have exactly one mount guard + one render target (no second shell runtime).');

assert.ok(index.includes('href="src/ui/v4-foundation.css"'), 'Shell presentation depends on the certified v4 foundation being linked.');

console.log('BibleQuest v4 Shell/Navigation static contract passed.');

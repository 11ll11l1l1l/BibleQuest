// BibleQuest V4 whole-app polish audit contract (acceptance checklist
// Section G). Locks in the fixes made during this audit pass and the
// invariants confirmed clean, so they cannot silently regress.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

// --- Typography hierarchy: every *-v4.css family file that owns a page
// heading must render it in the shared display/serif role. Community and
// Couples Journey were found missing this during the audit and fixed.
const communityCss = read('src/ui/community-family-v4.css');
assert.ok(/:is\([^)]*bq-community-head[^)]*\)\s*h1\{[^}]*font-family:var\(--font-display\)/.test(communityCss), 'Community family h1 must use the shared display typography role.');
const couplesJourneyCss = read('src/ui/couples-journey-v4.css');
assert.ok(/bq-couples-journey-intro h1[^{]*\{[^}]*font-family:var\(--font-display\)/.test(couplesJourneyCss), 'Couples Journey h1 must use the shared display typography role.');

// --- Reduced motion: every CSS file with a transition/animation must be
// covered either by its own local guard or the certified global one.
const globalMotionGuard = /@media\(prefers-reduced-motion:reduce\)\{\s*\*/.test(read('src/ui/v4-foundation.css'));
assert.ok(globalMotionGuard, 'Global reduced-motion catch-all in v4-foundation.css must remain in place - most feature CSS relies on it rather than a local guard.');

// --- Icon consistency: Community hub category icons must use real custom
// art (found as leftover emoji during the audit), matching the same
// pattern already certified for Avatar Vault/Home/Learn/More.
const artCss = read('src/ui/v4-custom-art.css');
for (const route of ['congregation', 'leaderboards', 'recognition', 'assignments', 'live-rooms', 'journey-groups', 'encouragements']) {
  const routeRe = new RegExp('\\[data-community-route="' + route + '"\\]\\s*>\\s*span\\s*\\{\\s*background-image:');
  assert.ok(routeRe.test(artCss), `Community hub icon for '${route}' must use real custom art, not an emoji placeholder.`);
}

// --- Document overflow: record the known coverage boundary so it isn't
// mistaken for exhaustive route coverage. This assertion fails loudly if
// PRIMARY_ROUTES silently changes without this audit note being revisited.
const widthTest = read('tests/v3-final-mobile-widths-smoke.mjs');
const primaryRoutesMatch = widthTest.match(/const PRIMARY_ROUTES = \[([^\]]+)\]/);
assert.ok(primaryRoutesMatch, 'Expected to find PRIMARY_ROUTES in the width-overflow smoke test.');
const primaryRoutes = primaryRoutesMatch[1].match(/'([a-z-]+)'/g).map(s => s.replace(/'/g, ''));
assert.deepEqual(primaryRoutes, ['home', 'learn', 'play', 'grow', 'more'], 'Automated overflow coverage is currently limited to the 5 primary nav routes only - deep-linked feature pages (Community, Couples Journey, Congregation, Admin Console, etc.) are NOT independently overflow-tested. This is a recorded, open audit gap (see V4_UI_WHOLE_APP_AUDIT.md), not something this assertion claims to close.');

console.log('BibleQuest v4 whole-app polish audit contract passed.');

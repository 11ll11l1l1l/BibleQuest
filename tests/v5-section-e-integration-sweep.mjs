import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

// Deferred V4 Section E was whole-app integration evidence. Keep this gate
// behavior-oriented: prove the maintained cross-surface contracts are still
// present and executable instead of pinning incidental DOM/file structure.
const requiredStatic = [
  'tests/v4-whole-app-audit-static.mjs',
  'tests/v4-bootstrap-order-edge.mjs',
  'tests/v4-primary-family-static.mjs',
  'tests/v4-home-assignments-edge.mjs',
  'tests/v4-community-family-static.mjs',
  'tests/v4-couples-journey-edge.mjs',
  'tests/v3-congregation-membership-edge.mjs',
  'tests/v3-notification-center-edge.mjs',
  'tests/v3-reader-edge.mjs',
  'tests/v3-games-edge.mjs',
];

const requiredBrowser = [
  'tests/v3-shell-smoke.mjs',
  'tests/v4-bootstrap-safety-net-smoke.mjs',
  'tests/v4-primary-family-smoke.mjs',
  'tests/v4-home-rail-smoke.mjs',
  'tests/v4-assignments-page-smoke.mjs',
  'tests/v4-daily-journey-page-smoke.mjs',
  'tests/v4-couples-journey-smoke.mjs',
  'tests/v3-notification-center-smoke.mjs',
  'tests/v3-reader-smoke.mjs',
  'tests/v3-games-smoke.mjs',
  'tests/v3-final-mobile-widths-smoke.mjs',
];

for (const file of [...requiredStatic, ...requiredBrowser]) {
  assert.equal(existsSync(file), true, `Section E maintained contract missing: ${file}`);
}

const regression = readFileSync('.github/workflows/v3-regression.yml', 'utf8');
for (const file of [...requiredStatic, ...requiredBrowser]) {
  assert.match(regression, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Accumulated regression no longer owns ${file}`);
}

console.log(`v5 Section E integration inventory: PASS (${requiredStatic.length} static + ${requiredBrowser.length} browser contracts)`);

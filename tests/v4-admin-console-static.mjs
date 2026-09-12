// BibleQuest V4 Admin Console presentation contract.
// This bottom-up tranche is deliberately CSS-only. Authorization, service ownership,
// mutations, routing callbacks and every existing data-* interaction hook remain in
// src/features/admin-console/index.js exactly as they were at the coordination baseline.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const featurePath = path.join(root, 'src', 'features', 'admin-console', 'index.js');
const admin = fs.readFileSync(featurePath, 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'ui', 'admin-console-v4.css'), 'utf8');

for (const hook of [
  'data-admin-console-view', 'data-admin-console-back', 'data-admin-console-operations',
  'data-admin-console-account', 'data-admin-console-retry', 'data-admin-console-refresh',
  'data-admin-console-search', 'data-admin-create-congregation', 'data-admin-create-group',
  'data-admin-platform-role', 'data-admin-congregation-role', 'data-admin-remove-congregation',
  'data-admin-add-congregation', 'data-admin-group-role', 'data-admin-group-owner',
  'data-admin-remove-group', 'data-admin-add-group', 'data-admin-delete-user',
  'data-admin-user', 'data-admin-membership', 'data-admin-group-membership'
]) {
  assert.ok(admin.includes(hook), `Admin Console must preserve interaction hook: ${hook}`);
}

// Exact presentation-only guard. This baseline is the shared coordination commit
// from which the bottom-up lane was created.
let baseline = null;
try {
  baseline = execFileSync('git', ['show', '33bf8bd16781df5d63c01526afb43454fcaad6d5:src/features/admin-console/index.js'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  });
} catch { /* Exact baseline may be unavailable in a shallow verification checkout. */ }
if (baseline !== null) {
  assert.equal(admin, baseline, 'Admin Console V4 presentation tranche must not change its V3 feature markup/logic.');
}

assert.ok(css.includes('[data-admin-console-view]'), 'V4 Admin Console CSS must remain route-scoped.');
assert.ok(css.includes('[data-admin-user]'), 'Member records need an explicit V4 administrative hierarchy.');
assert.ok(css.includes('[data-admin-membership]') && css.includes('[data-admin-group-membership]'), 'Congregation and small-group membership rows must receive the V4 high-trust treatment.');
assert.ok(css.includes('.bq-owner-control'), 'Permanent account deletion must remain a visually distinct irreversible-action zone.');
assert.ok(/\.bq-owner-control\{[^}]*border-left:4px solid var\(--danger\)/s.test(css), 'Irreversible actions must not rely on fill color alone.');
assert.ok(css.includes('@media(max-width:760px)') && css.includes('grid-template-columns:1fr'), 'Admin membership controls must collapse safely for narrow screens.');
assert.ok(css.includes('@media(prefers-contrast:more)'), 'Admin Console needs stronger-contrast support.');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'), 'Admin Console needs reduced-motion support.');
assert.ok(!/https?:\/\//.test(css), 'Admin Console V4 CSS must not introduce remote assets.');

console.log('BibleQuest v4 Admin Console presentation contract passed.');

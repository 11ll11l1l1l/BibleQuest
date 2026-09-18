// BibleQuest V4/V5 Tranche 13 presentation contract.
// Tranche 13 was CSS-only, but later approved V4/V5 functional work extends
// several protected owners. Preserve architecture, interaction and trust
// boundaries structurally rather than freezing obsolete file bytes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve(import.meta.dirname,'..');
const cssFiles={
  admin:fs.readFileSync(path.join(root,'src/ui/admin-console-v4.css'),'utf8'),
  operations:fs.readFileSync(path.join(root,'src/ui/admin-operations-v4.css'),'utf8'),
  review:fs.readFileSync(path.join(root,'src/ui/content-review-v4.css'),'utf8'),
  congregation:fs.readFileSync(path.join(root,'src/ui/congregation-v4.css'),'utf8'),
  reset:fs.readFileSync(path.join(root,'src/ui/reset-recovery-v4.css'),'utf8')
};

const expectedScopes={
  admin:'[data-admin-console-view]',
  operations:'[data-admin-operations-view]',
  review:'[data-content-review-view]',
  congregation:'[data-congregation-view]',
  reset:'[data-reset-recovery-view]'
};
for(const [name,css] of Object.entries(cssFiles)){
  assert.ok(css.includes(expectedScopes[name]),`${name} V4 styles must be route-scoped.`);
  assert.ok(css.includes('@media(prefers-contrast:more)'),`${name} must preserve stronger-contrast support.`);
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),`${name} must preserve reduced-motion support.`);
  assert.ok(!/https?:\/\//.test(css),`${name} must not introduce remote assets.`);
}

assert.ok(cssFiles.admin.includes('.bq-owner-control')&&cssFiles.admin.includes('border-left:4px solid var(--danger)'), 'Admin irreversible account deletion must remain structurally distinct, not color-only.');
assert.ok(cssFiles.operations.includes('.bq-ops-health-grid .bad')&&cssFiles.operations.includes('.bq-ops-health-grid .good'), 'Operations health needs explicit good/bad structural status markers.');
for(const state of ['pending','include','exempt','remove'])assert.ok(cssFiles.review.includes(`data-content-review-state=\"${state}\"`)||cssFiles.review.includes(`data-content-review-state="${state}"`),`Content Review must style ${state} state explicitly.`);
assert.ok(cssFiles.congregation.includes('[data-congregation-role]'),'Congregation role needs explicit high-trust hierarchy.');
assert.ok(cssFiles.reset.includes('.bq-recovery-code')&&cssFiles.reset.includes('border:2px dashed'), 'Replacement recovery code must be visually prominent without relying on color alone.');

// Existing interaction hooks and feature-owner boundaries must remain intact.
const hooks={
  'src/features/admin-console/index.js':['export function adminConsolePage','data-admin-console-view','data-admin-console-search','data-admin-delete-user','data-admin-platform-role','data-admin-congregation-role','data-admin-group-role'],
  'src/features/admin-operations/index.js':['data-ops-filter','data-ops-refresh','data-ops-health'],
  'src/features/content-review/index.js':['data-content-review-decide','data-content-review-congregation','data-content-review-filter'],
  'src/features/congregation/index.js':['data-congregation-join','data-congregation-role','data-congregation-back'],
  'src/features/reset-recovery/index.js':['data-reset-recovery-form','data-reset-recovery-code','data-reset-finish']
};
const sources={};
for(const [relative,required] of Object.entries(hooks)){
  const source=fs.readFileSync(path.join(root,relative),'utf8');
  sources[relative]=source;
  for(const hook of required)assert.ok(source.includes(hook),`${relative} must preserve ${hook}.`);
  assert.ok(!source.includes('createClient('),`${relative} must not create a second Supabase client.`);
  assert.ok(!/supabase\.co|service[_-]?role|sb_secret_/i.test(source),`${relative} must not embed privileged backend access.`);
}

// Admin Console may evolve after Tranche 13, but it must continue using the
// injected service owners rather than introducing a direct Supabase/auth admin
// transport or a duplicate platform-management runtime.
const adminSource=sources['src/features/admin-console/index.js'];
assert.ok(adminSource.includes('adminConsolePage({admin,accountDeletion'), 'Admin Console must remain driven by the injected Admin Console and Admin Operations owners.');
assert.ok(!/fetch\s*\(\s*[`'\"](?:\/|https?:).*auth\/v1\/admin/.test(adminSource), 'Admin Console presentation must not bypass the shared API owner with direct auth-admin requests.');

// V5 congregation switching must continue through the existing congregation
// feature owner rather than creating a parallel membership/runtime path.
const congregationSource=sources['src/features/congregation/index.js'];
assert.ok(congregationSource.includes('data-congregation-'), 'V5 congregation evolution must remain inside the certified feature owner.');

console.log('BibleQuest v4/v5 Tranche 13 structural presentation contract passed.');

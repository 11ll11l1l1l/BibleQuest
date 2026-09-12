// BibleQuest V4 Tranche 13 presentation contract.
// Tranche 13 itself was CSS-only. Later functional tranches may legitimately
// extend protected feature owners, so preserve its architecture/interaction
// contract structurally rather than freezing every owner forever.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
// Exact active V4 HEAD immediately before Tranche 13 was integrated into the single stream.
const baselineSha='76474d070da75cb8e0a9210642ea9e426b545200';

// These owners have not received a later approved functional tranche, so the
// original Tranche 13 byte lock remains useful for them. Admin Console is
// intentionally excluded from this byte lock because V4 Phase 2 now extends
// that existing owner with emergency user-management controls. Its ownership
// and required hooks are guarded below instead.
const byteLockedFeatures=[
  ['admin-operations','src/features/admin-operations/index.js'],
  ['content-review','src/features/content-review/index.js'],
  ['congregation','src/features/congregation/index.js'],
  ['reset-recovery','src/features/reset-recovery/index.js']
];

for(const [name,relative] of byteLockedFeatures){
  const current=fs.readFileSync(path.join(root,relative),'utf8');
  let baseline=null;
  try{baseline=execFileSync('git',['show',`${baselineSha}:${relative}`],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch{}
  if(baseline!==null)assert.equal(current,baseline,`${name} must remain byte-for-byte unchanged unless a later approved functional tranche explicitly updates its contract.`);
}

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
for(const [relative,required] of Object.entries(hooks)){
  const source=fs.readFileSync(path.join(root,relative),'utf8');
  for(const hook of required)assert.ok(source.includes(hook),`${relative} must preserve ${hook}.`);
}

// Admin Console may evolve after Tranche 13, but it must continue using the
// injected service owners rather than introducing a direct Supabase/auth admin
// transport or a duplicate platform-management runtime.
const adminSource=fs.readFileSync(path.join(root,'src/features/admin-console/index.js'),'utf8');
assert.ok(adminSource.includes('adminConsolePage({admin,accountDeletion'), 'Admin Console must remain driven by the injected Admin Console and Admin Operations owners.');
assert.ok(!adminSource.includes('createClient('), 'Admin Console presentation must not create a second Supabase client.');
assert.ok(!/fetch\s*\(\s*[`'\"](?:\/|https?:).*auth\/v1\/admin/.test(adminSource), 'Admin Console presentation must not bypass the shared API owner with direct auth-admin requests.');

console.log('BibleQuest v4 Tranche 13 static presentation contract passed.');

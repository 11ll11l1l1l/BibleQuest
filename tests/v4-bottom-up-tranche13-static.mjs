// BibleQuest V4 bottom-up Tranche 13 presentation contract.
// Admin Console, Admin Operations, Content Review, Congregation and Reset/Recovery
// are presentation-only here. Their V3 feature code and authority boundaries remain byte-exact.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const baselineSha='33bf8bd16781df5d63c01526afb43454fcaad6d5';
const features=[
  ['admin-console','src/features/admin-console/index.js'],
  ['admin-operations','src/features/admin-operations/index.js'],
  ['content-review','src/features/content-review/index.js'],
  ['congregation','src/features/congregation/index.js'],
  ['reset-recovery','src/features/reset-recovery/index.js']
];

for(const [name,relative] of features){
  const current=fs.readFileSync(path.join(root,relative),'utf8');
  let baseline=null;
  try{baseline=execFileSync('git',['show',`${baselineSha}:${relative}`],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch{}
  if(baseline!==null)assert.equal(current,baseline,`${name} must remain byte-for-byte unchanged in the CSS-only Tranche 13 redesign.`);
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

// Existing interaction hooks must still exist in the untouched feature owners.
const hooks={
  'src/features/admin-console/index.js':['data-admin-console-search','data-admin-delete-user','data-admin-platform-role'],
  'src/features/admin-operations/index.js':['data-ops-filter','data-ops-refresh','data-ops-health'],
  'src/features/content-review/index.js':['data-content-review-decide','data-content-review-congregation','data-content-review-filter'],
  'src/features/congregation/index.js':['data-congregation-join','data-congregation-role','data-congregation-back'],
  'src/features/reset-recovery/index.js':['data-reset-recovery-form','data-reset-recovery-code','data-reset-finish']
};
for(const [relative,required] of Object.entries(hooks)){
  const source=fs.readFileSync(path.join(root,relative),'utf8');
  for(const hook of required)assert.ok(source.includes(hook),`${relative} must preserve ${hook}.`);
}

console.log('BibleQuest v4 bottom-up Tranche 13 static presentation contract passed.');

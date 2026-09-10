import fs from 'node:fs';
import { workflowInvokesNode } from './v3-workflow-contract.mjs';

const failures=[];
const fail=message=>failures.push(message);
const read=file=>fs.readFileSync(file,'utf8');
const required=['ADMIN_CONSOLE_V3.md','FEATURE_INVENTORY_V3.md','admin.html','src/app/admin-entry.js','src/app/admin-console.js','src/app/session.js','src/core/api.js','src/features/admin-console/index.js','supabase/functions/bq-admin/index.ts','tests/v3-admin-console-edge.mjs','tests/v3-admin-console-smoke.mjs','.github/workflows/v3-regression.yml'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing #92 Admin Console file: ${file}`);

if(!failures.length){
  const contract=read('ADMIN_CONSOLE_V3.md');
  const shell=read('admin.html');
  const entry=read('src/app/admin-entry.js');
  const service=read('src/app/admin-console.js');
  const ui=read('src/features/admin-console/index.js');
  const api=read('src/core/api.js');
  const backend=read('supabase/functions/bq-admin/index.ts');
  const inventory=read('FEATURE_INVENTORY_V3.md');
  const workflow=read('.github/workflows/v3-regression.yml');

  for(const forbidden of ['localStorage','sessionStorage','window.BQ','MutationObserver','document.','fetch(','createClient','@supabase','.from('])if(service.includes(forbidden))fail(`Admin Console service bypasses a verified owner: ${forbidden}`);
  for(const forbidden of ['localStorage','sessionStorage','window.BQ','MutationObserver','createClient','@supabase','.from(','fetch(','bq-admin-ops'])if(ui.includes(forbidden))fail(`Admin Console UI bypasses a verified owner or #93 boundary: ${forbidden}`);
  for(const forbidden of ['admin.js','admin-hardening.js','owner-delete-control.js','cdn.jsdelivr.net/npm/@supabase/supabase-js'])if(shell.includes(forbidden))fail(`v3 admin.html still loads legacy/duplicate runtime: ${forbidden}`);
  const adminConsoleFacade=api.match(/const adminConsole=Object\.freeze\(\{[\s\S]*?\n  \}\);/)?.[0]||'';
  if(!adminConsoleFacade)fail('Shared API must retain a bounded Admin Console facade.');
  if(entry.includes('bq-admin-ops')||service.includes('bq-admin-ops')||adminConsoleFacade.includes('bq-admin-ops'))fail('Capability #92 must not absorb the #93 bq-admin-ops surface.');

  for(const token of ["new Set(['owner','admin'])","new Set(['member','admin','owner'])",'createAdminConsoleService','api.status()','api.listUsers({page:1,perPage:200})',"reset('signed-out')","reset('unauthorized'",'BQ_ADMIN_NOT_READY','setRole','setCongregation','removeCongregation','setCongregationRole','createCongregation','createSmallGroup','setGroupMembership','setGroupOwner'])if(!service.includes(token))fail(`Admin Console service missing contract token: ${token}`);
  for(const token of ['adminConsolePage','data-admin-console-view','data-admin-platform-role','data-admin-congregation-role','data-admin-remove-congregation','data-admin-add-congregation','data-admin-group-role','data-admin-group-owner','data-admin-remove-group','data-admin-add-group','data-admin-create-congregation','data-admin-create-group','admin.refresh()','admin.clear()'])if(!ui.includes(token))fail(`Admin Console UI missing contract token: ${token}`);
  for(const token of ['createStore','createSessionService','createAdminConsoleService','createApi','api.adminConsole','await session.boot()','adminConsolePage'])if(!entry.includes(token))fail(`Standalone Admin Console entry missing composition token: ${token}`);
  for(const token of ['id="admin-app"','src/ui/app.css','src/app/admin-entry.js','noindex,nofollow'])if(!shell.includes(token))fail(`v3 admin.html missing standalone contract token: ${token}`);

  for(const token of ["const adminConsole=Object.freeze", "invoke('bq-admin',{action:'status'})", "action:'list_users'", "action:'set_role'", "action:'set_congregation'", "action:'remove_congregation'", "action:'set_congregation_role'", "invoke('bq-create-congregation',{name})", "action:'create_small_group'", "action:'set_group_membership'", "action:'set_group_owner'"])if(!api.includes(token))fail(`Shared API missing Admin Console facade contract: ${token}`);
  const exportMatch=api.match(/return Object\.freeze\(\{([^}]*)\}\);\s*\n\}/m);
  const exports=new Set((exportMatch?.[1]||'').split(',').map(value=>value.trim()).filter(Boolean));
  for(const name of ['contentReview','adminConsole','media'])if(!exports.has(name))fail(`Shared API return contract must retain ${name}.`);
  for(const token of ['requireUser','requireAdmin',"['owner','admin'].includes(data.role)","if(action==='status')","if(action==='list_users')","if(action==='set_role')","if(action==='set_congregation')","if(action==='remove_congregation')","if(action==='set_congregation_role')","if(action==='create_small_group')","if(action==='set_group_membership')","if(action==='set_group_owner')"])if(!backend.includes(token))fail(`Retained bq-admin authority missing contract token: ${token}`);
  for(const token of ['#92 Admin console','#93 Admin operations','bq-admin-ops','Password recovery'])if(!contract.includes(token))fail(`Admin Console recovery contract missing boundary token: ${token}`);

  const row92=inventory.split('\n').find(line=>line.startsWith('| 92 |'))||'';
  const row93=inventory.split('\n').find(line=>line.startsWith('| 93 |'))||'';
  const lifecycle='(?:Not started|Implemented|Verified|Regression-tested)';
  if(!new RegExp(`\\| ${lifecycle} \\|`).test(row92))fail('Inventory #92 Admin Console must use a valid lifecycle state.');
  if(!new RegExp(`\\| ${lifecycle} \\|`).test(row93))fail('Inventory #93 Admin Operations must use a valid lifecycle state.');
  if(!/^\s*on:\s*\n\s+workflow_dispatch:\s*$/m.test(workflow))fail('Product v3 regression workflow must remain workflow_dispatch-only.');
  if(/\n\s+push:\s*$/m.test(workflow))fail('Product v3 regression workflow must not contain a push trigger.');
  for(const test of ['scripts/validate-v3-admin-console.mjs','tests/v3-admin-console-edge.mjs','tests/v3-admin-console-smoke.mjs'])if(!workflowInvokesNode(workflow,test))fail(`Accumulated workflow missing #92 regression: ${test}`);
}

if(failures.length){failures.forEach(item=>console.error(`- ${item}`));process.exit(1)}
console.log('BibleQuest v3 Admin Console architecture/ownership boundary passed.');

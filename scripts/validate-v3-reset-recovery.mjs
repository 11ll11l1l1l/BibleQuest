import fs from 'node:fs';
import { workflowInvokesNode } from './v3-workflow-contract.mjs';

const failures=[];
const fail=message=>failures.push(message);
const read=file=>fs.readFileSync(file,'utf8');
const required=['RESET_RECOVERY_V3.md','reset.html','_redirects','src/app/reset-entry.js','src/app/reset-recovery.js','src/app/account.js','src/app/backup.js','src/core/api.js','src/core/storage.js','src/features/reset-recovery/index.js','src/ui/reset-recovery.css','tests/v3-reset-recovery-edge.mjs','tests/v3-reset-recovery-smoke.mjs','.github/workflows/v3-regression.yml','FEATURE_INVENTORY_V3.md'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing #94 Reset Recovery file: ${file}`);

if(!failures.length){
  const contract=read('RESET_RECOVERY_V3.md');
  const shell=read('reset.html');
  const entry=read('src/app/reset-entry.js');
  const service=read('src/app/reset-recovery.js');
  const ui=read('src/features/reset-recovery/index.js');
  const account=read('src/app/account.js');
  const backup=read('src/app/backup.js');
  const api=read('src/core/api.js');
  const storage=read('src/core/storage.js');
  const redirects=read('_redirects');
  const workflow=read('.github/workflows/v3-regression.yml');
  const inventory=read('FEATURE_INVENTORY_V3.md');

  for(const forbidden of ['document.','window.','location.','localStorage','sessionStorage','fetch(','createClient','api.','storage.'])if(service.includes(forbidden))fail(`Reset Recovery service bypasses an existing owner: ${forbidden}`);
  for(const forbidden of ['fetch(','createClient','@supabase','localStorage','sessionStorage','api.account','account.resetPassword'])if(ui.includes(forbidden))fail(`Reset Recovery UI bypasses its page-state/Account owners: ${forbidden}`);
  for(const token of ['createResetRecoveryService','account.resetPassword','status:\'submitting\'','status:\'success\'','status:\'error\'','status:\'cancelled\'','BQ_RESET_BUSY','acknowledgeSaved'])if(!service.includes(token))fail(`Reset Recovery state owner missing contract token: ${token}`);
  for(const token of ['resetRecoveryPage','data-reset-recovery-form','data-reset-cancel','data-reset-recovery-code','data-reset-saved','data-reset-finish','recovery.submit','recovery.cancel','recovery.acknowledgeSaved'])if(!ui.includes(token))fail(`Reset Recovery UI missing contract token: ${token}`);
  for(const token of ['createStore','createSessionService','createAccountService','createResetRecoveryService','createApi','storage','resetRecoveryPage','location.replace(\'./#account\')'])if(!entry.includes(token))fail(`Reset Recovery entry missing composition token: ${token}`);
  if(entry.includes('session.boot('))fail('Standalone Reset Recovery must not boot an authenticated remote session before recovery.');
  for(const forbidden of ['cloud-config.js','reset.js','cdn.jsdelivr.net/npm/@supabase','<style>','<script src='])if(shell.includes(forbidden))fail(`v3 reset.html still loads legacy/direct runtime: ${forbidden}`);
  for(const token of ['id="reset-app"','src/ui/app.css','src/ui/reset-recovery.css','type="module" src="src/app/reset-entry.js"','noindex,nofollow'])if(!shell.includes(token))fail(`v3 reset.html missing standalone shell token: ${token}`);
  if(!redirects.includes('/reset.html /reset 301'))fail('Cloudflare compatibility redirect must retain /reset.html -> /reset.');

  if(!account.includes('async function resetPassword(input)')||!account.includes('return api.account.resetPassword'))fail('#9 Account service must remain the recovery transaction owner.');
  if(!api.includes("async resetPassword(payload)")||!api.includes("invoke('bq-password-reset', { action: 'reset'"))fail('Shared API must retain the verified bq-password-reset boundary.');
  if(!backup.includes('resetPortableEntries')||!storage.includes('resetPortableEntries()'))fail('#100 portable-data reset ownership must remain separate and intact.');
  if(/resetPortableEntries|exportPortableEntries|replacePortableEntries/.test(service+ui+entry))fail('#94 must not absorb #100 portable backup/reset ownership.');

  for(const token of ['#94','standalone','account.resetPassword','#9','#100','Cancellation','Invalid/error state','replacement recovery code'])if(!contract.includes(token))fail(`Reset Recovery contract missing boundary token: ${token}`);
  const row94=inventory.split('\n').find(line=>line.startsWith('| 94 |'))||'';
  if(!/\| (Not started|Implemented|Verified|Regression-tested) \|/.test(row94))fail('Inventory #94 Reset/recovery page must use a valid lifecycle state.');

  if(!/^\s*on:\s*\n\s+workflow_dispatch:\s*$/m.test(workflow))fail('Product v3 regression workflow must remain workflow_dispatch-only.');
  if(/\n\s+push:\s*$/m.test(workflow))fail('Product v3 regression workflow must not contain a push trigger.');
  for(const test of ['scripts/validate-v3-reset-recovery.mjs','tests/v3-reset-recovery-edge.mjs','tests/v3-reset-recovery-smoke.mjs'])if(!workflowInvokesNode(workflow,test))fail(`Accumulated workflow missing #94 regression: ${test}`);
}

if(failures.length){failures.forEach(item=>console.error(`- ${item}`));process.exit(1)}
console.log('BibleQuest v3 Reset Recovery architecture/ownership boundary passed.');

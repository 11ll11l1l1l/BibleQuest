import fs from 'node:fs';

const failures=[];
const fail=message=>failures.push(message);
const read=file=>fs.readFileSync(file,'utf8');
const required=['OPERATIONAL_RECOVERY_V3.md','ARCHITECTURE_V3.md','FEATURE_INVENTORY_V3.md','index.html','src/app/operational-recovery.js','src/app/bootstrap.js','src/app/router.js','src/ui/shell.js','src/ui/operational-recovery.css'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing operational recovery file: ${file}`);
if(!failures.length){
  const owner=read('src/app/operational-recovery.js');
  const bootstrap=read('src/app/bootstrap.js');
  const router=read('src/app/router.js');
  const shell=read('src/ui/shell.js');
  const architecture=read('ARCHITECTURE_V3.md');
  const inventory=read('FEATURE_INVENTORY_V3.md');
  const index=read('index.html');
  for(const contract of['createOperationalRecoveryService','capture','retry','home','dismiss','getState'])if(!owner.includes(contract))fail(`Operational recovery owner missing contract ${contract}.`);
  if(/localStorage|sessionStorage|fetch\s*\(|\.from\(|functions\.invoke|document\.|window\.|location\.|history\.|MutationObserver/.test(owner))fail('Operational recovery owner bypasses navigation, DOM, storage, or API ownership.');
  for(const contract of['createOperationalRecoveryService','recovery.run','shell.renderRecovery','router.navigate(route)','router.navigate(\'home\')'])if(!bootstrap.includes(contract))fail(`Bootstrap is missing operational recovery composition: ${contract}.`);
  if(!shell.includes('data-recovery-retry')||!shell.includes('data-recovery-home')||!shell.includes('role="alert"'))fail('Shell recovery presentation must expose alert, Retry, and Home controls.');
  if(/createOperationalRecoveryService|recoveryState|activeRecovery/.test(shell))fail('Shell must not own operational recovery state.');
  if(/renderRecovery|createOperationalRecoveryService/.test(router))fail('Router must remain recovery-agnostic and own navigation/history only.');
  for(const contract of['src/app/operational-recovery.js','## Operational recovery / error-boundary boundaries','router remains the only navigation/history owner'])if(!architecture.includes(contract))fail(`Architecture contract missing operational recovery boundary: ${contract}`);
  if(!inventory.includes('| 96 | Operational recovery/error boundary | Yes | Clean basic | Regression-tested |'))fail('#96 must remain Regression-tested after later complete suites.');
  for(const total of['**Regression-tested:** 61','**Verified:** 1','**Not started:** 38'])if(!inventory.includes(total))fail(`Inventory totals missing post-#100 bookkeeping: ${total}`);
  if(!index.includes('src/ui/operational-recovery.css'))fail('Operational recovery stylesheet is not loaded by the v3 shell.');
  for(const forbidden of['window.onerror','unhandledrejection','MutationObserver','recoverScript','window.BQ'])if(bootstrap.includes(forbidden)||owner.includes(forbidden))fail(`Operational recovery must not recreate legacy runtime behavior: ${forbidden}`);
}
if(failures.length){for(const item of failures)console.error(`- ${item}`);process.exit(1)}
console.log('BibleQuest v3 operational recovery architecture boundary passed.');

import fs from 'node:fs';
const failures=[];const fail=message=>failures.push(message);const read=file=>fs.readFileSync(file,'utf8');
const required=['CLIENT_DIAGNOSTICS_V3.md','ERROR_CODES.md','ARCHITECTURE_V3.md','FEATURE_INVENTORY_V3.md','src/core/client-diagnostics.js','src/core/api.js','src/app/operational-recovery.js','src/app/bootstrap.js','src/ui/shell.js'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing client diagnostics file: ${file}`);
if(!failures.length){
  const owner=read('src/core/client-diagnostics.js'),api=read('src/core/api.js'),recovery=read('src/app/operational-recovery.js'),bootstrap=read('src/app/bootstrap.js'),shell=read('src/ui/shell.js'),architecture=read('ARCHITECTURE_V3.md'),inventory=read('FEATURE_INVENTORY_V3.md');
  for(const code of['BQ-NET-001','BQ-NET-002','BQ-MOD-001','BQ-UNK-001'])if(!owner.includes(code))fail(`Client diagnostics owner missing stable code ${code}.`);
  for(const contract of['createClientDiagnosticsService','probeConnection','serverReachable','forceProbe'])if(!owner.includes(contract))fail(`Client diagnostics owner missing contract ${contract}.`);
  if(/localStorage|sessionStorage|fetch\s*\(|document\.|window\.|\.from\(|functions\.invoke|MutationObserver/.test(owner))fail('Client diagnostics owner bypasses API, DOM, or storage ownership.');
  for(const contract of['diagnostics','bq-net-probe','cache:\'no-store\'','credentials:\'same-origin\''])if(!api.includes(contract))fail(`API boundary missing diagnostic probe contract ${contract}.`);
  for(const contract of['createClientDiagnosticsService','api.diagnostics.probe','kind:\'module\'','updateRecoveryDiagnostic'])if(!bootstrap.includes(contract))fail(`Bootstrap missing Diagnostics/Recovery composition: ${contract}.`);
  if(!recovery.includes("result?.catch?.(()=>{})"))fail('Recovery must isolate rejected async diagnostic reporters.');
  if(!shell.includes('data-recovery-diagnostic')||!shell.includes('data-diagnostic-code'))fail('Shell must render owner-supplied diagnostic status/code.');
  for(const contract of['src/core/client-diagnostics.js','## Client diagnostics boundaries','API owner performs the same-origin probe'])if(!architecture.includes(contract))fail(`Architecture missing client diagnostics boundary: ${contract}`);
  if(!inventory.includes('| 95 | Client diagnostics | Yes | Compatibility | Regression-tested |'))fail('#95 must remain Regression-tested after later complete suites.');
  for(const total of['**Regression-tested:** 60','**Verified:** 1','**Not started:** 39'])if(!inventory.includes(total))fail(`Inventory totals missing post-#99 bookkeeping: ${total}`);
  for(const forbidden of['addEventListener(\'error\'','unhandledrejection','setInterval','bible_client_errors','window.BQDiagnostics','MutationObserver'])if(owner.includes(forbidden)||bootstrap.includes(forbidden))fail(`Client diagnostics must not recreate legacy global behavior: ${forbidden}`);
}
if(failures.length){for(const item of failures)console.error(`- ${item}`);process.exit(1)}
console.log('BibleQuest v3 client diagnostics architecture boundary passed.');

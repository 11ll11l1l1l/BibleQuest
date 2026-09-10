import fs from 'node:fs';
import { workflowInvokesNode } from './v3-workflow-contract.mjs';

const failures=[];
const fail=message=>failures.push(message);
const read=file=>fs.readFileSync(file,'utf8');
const required=[
  'ACCESSIBILITY_SUPPORT_V3.md','FEATURE_INVENTORY_V3.md','src/app/accessibility.js','src/ui/accessibility.js','src/features/accessibility/index.js','src/features/more/index.js','src/app/bootstrap.js','src/core/storage.js','src/ui/accessibility.css','index.html','tests/v3-accessibility-edge.mjs','tests/v3-accessibility-smoke.mjs','.github/workflows/v3-regression.yml'
];
for(const file of required)if(!fs.existsSync(file))fail(`Missing #86 Accessibility file: ${file}`);

if(!failures.length){
  const service=read('src/app/accessibility.js');
  const runtime=read('src/ui/accessibility.js');
  const page=read('src/features/accessibility/index.js');
  const more=read('src/features/more/index.js');
  const bootstrap=read('src/app/bootstrap.js');
  const css=read('src/ui/accessibility.css');
  const index=read('index.html');
  const inventory=read('FEATURE_INVENTORY_V3.md');
  const workflow=read('.github/workflows/v3-regression.yml');

  for(const forbidden of ['localStorage','sessionStorage','window.BQ','MutationObserver','document.','createClient','@supabase','progress.'])if(service.includes(forbidden))fail(`Accessibility preference owner bypasses a verified owner: ${forbidden}`);
  for(const token of ["const STORAGE_KEY = 'accessibility-settings'","['normal', 'large', 'xlarge']","['system', 'reduce', 'full']","['normal', 'strong']",'storage.read(STORAGE_KEY','storage.write(STORAGE_KEY','effectiveMotion','addEventListener?.(\'change\'','removeEventListener?.(\'change\''])if(!service.includes(token))fail(`Accessibility preference owner missing contract token: ${token}`);

  for(const forbidden of ['localStorage','sessionStorage','window.BQ','MutationObserver','createClient','@supabase'])if(runtime.includes(forbidden))fail(`Accessibility UI runtime bypasses a verified owner: ${forbidden}`);
  for(const token of ['mountAccessibilityRuntime','keepFocusInDialog','[role="dialog"][aria-modal="true"]','root.dataset.bqText','root.dataset.bqEffectiveMotion','addEventListener(\'keydown\''])if(!runtime.includes(token))fail(`Accessibility UI runtime missing contract token: ${token}`);

  for(const forbidden of ['localStorage','sessionStorage','createClient','@supabase','progress.','storage.','MutationObserver'])if(page.includes(forbidden))fail(`Accessibility settings page bypasses its service: ${forbidden}`);
  for(const token of ['data-accessibility-page','data-accessibility-setting="text"','data-accessibility-setting="motion"','data-accessibility-setting="contrast"','data-accessibility-reset'])if(!page.includes(token))fail(`Accessibility page missing control contract: ${token}`);
  if(!more.includes('data-open-accessibility')||!more.includes('onAccessibility'))fail('More must expose the verified Accessibility route through an explicit callback.');
  for(const token of ["createAccessibilityService({storage})",'mountAccessibilityRuntime({accessibility})',"accessibility:()=>accessibilityPage({accessibility",'onAccessibility:()=>router.navigate(\'accessibility\')','accessibilityRuntime.dispose()','accessibility.dispose()'])if(!bootstrap.includes(token))fail(`Bootstrap missing Accessibility composition contract: ${token}`);
  if(!index.includes('src/ui/accessibility.css'))fail('index.html does not load Accessibility presentation CSS.');

  for(const token of ['html[data-bq-text="large"]','html[data-bq-text="xlarge"]','html[data-bq-contrast="strong"]','html[data-bq-effective-motion="reduce"]',':focus-visible','outline:3px solid currentColor!important','@media(max-width:430px)'])if(!css.includes(token))fail(`Accessibility CSS missing retained presentation contract: ${token}`);

  const row86=inventory.split('\n').find(line=>line.startsWith('| 86 |'))||'';
  if(!/\| (Not started|Implemented|Verified|Regression-tested) \|/.test(row86))fail('Inventory #86 Accessibility support must use a valid lifecycle state.');
  for(const test of ['scripts/validate-v3-accessibility.mjs','tests/v3-accessibility-edge.mjs','tests/v3-accessibility-smoke.mjs'])if(!workflowInvokesNode(workflow,test))fail(`Accumulated workflow missing #86 regression: ${test}`);
}

if(failures.length){failures.forEach(item=>console.error(`- ${item}`));process.exit(1)}
console.log('BibleQuest v3 Accessibility architecture/ownership boundary passed.');

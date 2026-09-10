import fs from 'node:fs';
import { workflowInvokesNode } from './v3-workflow-contract.mjs';

const failures = [];
const fail = message => failures.push(message);
const read = file => fs.readFileSync(file, 'utf8');
const required = [
  'TUTORIAL_ONBOARDING_V3.md',
  'FEATURE_INVENTORY_V3.md',
  'src/app/tutorial.js',
  'src/features/tutorial/index.js',
  'src/features/home/index.js',
  'src/features/account/index.js',
  'src/app/bootstrap.js',
  'src/core/storage.js',
  'src/app/offline-shell.js',
  'src/ui/tutorial.css',
  'index.html',
  'tests/v3-tutorial-onboarding-edge.mjs',
  'tests/v3-tutorial-onboarding-smoke.mjs',
  '.github/workflows/v3-regression.yml'
];
for (const file of required) if (!fs.existsSync(file)) fail(`Missing #84 Tutorial/onboarding file: ${file}`);

if (!failures.length) {
  const contract = read('TUTORIAL_ONBOARDING_V3.md');
  const service = read('src/app/tutorial.js');
  const ui = read('src/features/tutorial/index.js');
  const home = read('src/features/home/index.js');
  const account = read('src/features/account/index.js');
  const bootstrap = read('src/app/bootstrap.js');
  const index = read('index.html');
  const inventory = read('FEATURE_INVENTORY_V3.md');
  const workflow = read('.github/workflows/v3-regression.yml');

  for (const forbidden of ['localStorage', 'sessionStorage', 'window.BQ', 'MutationObserver', 'createClient', '@supabase', 'document.']) {
    if (service.includes(forbidden)) fail(`Tutorial lifecycle bypasses a verified owner: ${forbidden}`);
  }
  for (const token of ['createTutorialService', 'force = false', 'skip()', 'finish()', "storage.write(STORAGE_KEY"]) {
    if (!service.includes(token)) fail(`Tutorial lifecycle missing contract token: ${token}`);
  }
  if (service.includes('offerFirstRun')) fail('Tutorial lifecycle must not auto-offer on anonymous Home; retained production triggers onboarding after account creation or explicit launcher use.');

  for (const forbidden of ['localStorage', 'sessionStorage', 'window.BQ', 'MutationObserver', 'createClient', '@supabase']) {
    if (ui.includes(forbidden)) fail(`Tutorial presenter bypasses a verified owner: ${forbidden}`);
  }
  for (const token of ['data-bq-tutorial-layer', 'role="dialog"', 'data-tutorial-back', 'data-tutorial-next', 'data-tutorial-skip', 'data-tutorial-action']) {
    if (!ui.includes(token)) fail(`Tutorial presenter missing interaction contract: ${token}`);
  }

  for (const token of ['data-open-tutorial', 'Show tutorial', 'onTutorial']) if (!home.includes(token)) fail(`Home missing permanent tutorial launcher contract: ${token}`);
  for (const token of ['onTutorial?.()', 'data-code-saved', 'data-code-done']) if (!account.includes(token)) fail(`Account missing recovery-save tutorial handoff: ${token}`);
  for (const forbidden of ['onTutorial?.(result.recovery_code', 'onTutorial?.(code', 'bq-account-created', 'sessionStorage']) if (account.includes(forbidden)) fail(`Account leaked recovery material or legacy trigger state into tutorial handoff: ${forbidden}`);

  for (const token of [
    'createTutorialService({storage})',
    'mountTutorialOverlay({tutorial',
    "onTutorial:()=>tutorial.open({force:true})",
    "onTutorial:()=>tutorial.open({force:true})",
    'tutorialOverlay.dispose()'
  ]) if (!bootstrap.includes(token)) fail(`Bootstrap missing #84 composition contract: ${token}`);
  if (bootstrap.includes('tutorial.offerFirstRun')) fail('Bootstrap must not auto-open onboarding merely because Home rendered.');
  if ((bootstrap.match(/onTutorial:\(\)=>tutorial\.open\(\{force:true\}\)/g) || []).length < 2) fail('Both Account completion and the permanent Home launcher must reach the same tutorial owner through explicit callbacks.');

  if (!index.includes('src/ui/tutorial.css')) fail('index.html does not load tutorial presentation CSS.');
  for (const token of ['#85', 'Not started', 'recovery code', 'offline', 'anonymous Home']) if (!contract.includes(token)) fail(`Tutorial contract missing explicit boundary: ${token}`);

  const row = n => inventory.split('\n').find(line => line.startsWith(`| ${n} |`)) || '';
  if (!/\| (Not started|Implemented|Verified|Regression-tested) \|/.test(row(84))) fail('Inventory #84 Tutorial/onboarding trainer must use a valid lifecycle state.');
  if (!/\| (Not started|Implemented|Verified|Regression-tested) \|/.test(row(85))) fail('Inventory #85 Tutorial avatar reactions must use a valid lifecycle state after #84 verification.');

  for (const test of ['scripts/validate-v3-tutorial-onboarding.mjs', 'tests/v3-tutorial-onboarding-edge.mjs', 'tests/v3-tutorial-onboarding-smoke.mjs']) {
    if (!workflowInvokesNode(workflow, test)) fail(`Accumulated workflow missing #84 regression: ${test}`);
  }
}

if (failures.length) {
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
console.log('BibleQuest v3 Tutorial/onboarding architecture/ownership boundary passed.');
import fs from 'node:fs';
import { workflowInvokesNode } from './v3-workflow-contract.mjs';

const failures = [];
const fail = message => failures.push(message);
const read = file => fs.readFileSync(file, 'utf8');
const required = [
  'TUTORIAL_AVATAR_REACTIONS_V3.md',
  'FEATURE_INVENTORY_V3.md',
  'src/features/tutorial/trainer.js',
  'src/features/tutorial/index.js',
  'src/ui/tutorial.css',
  'assets/tutorial-trainer-sprite.webp',
  'tests/v3-tutorial-avatar-reactions-edge.mjs',
  'tests/v3-tutorial-avatar-reactions-smoke.mjs',
  '.github/workflows/v3-regression.yml'
];
for (const file of required) if (!fs.existsSync(file)) fail(`Missing #85 Tutorial trainer-reaction file: ${file}`);

if (!failures.length) {
  const trainer = read('src/features/tutorial/trainer.js');
  const presenter = read('src/features/tutorial/index.js');
  const css = read('src/ui/tutorial.css');
  const inventory = read('FEATURE_INVENTORY_V3.md');
  const workflow = read('.github/workflows/v3-regression.yml');

  for (const forbidden of ['localStorage', 'sessionStorage', 'window.BQ', 'MutationObserver', 'createClient', '@supabase', 'fetch(', 'progress.', 'storage.']) {
    if (trainer.includes(forbidden)) fail(`Trainer state mapping bypasses a verified owner: ${forbidden}`);
  }
  for (const token of [
    "['welcome', 'right', 'left', 'up', 'down', 'thumbs', 'surprise', 'thoughtful']",
    "['welcome', 'down', 'right', 'up', 'thoughtful', 'left', 'thumbs', 'surprise', 'thumbs']",
    'trainerStateForStep',
    "return TUTORIAL_STEP_TRAINER_STATES[index] || 'welcome'"
  ]) if (!trainer.includes(token)) fail(`Trainer state mapping missing retained contract token: ${token}`);

  for (const token of ["from './trainer.js'", 'data-trainer-state', 'bq-tutorial-trainer-visual', 'trainerStateForStep', 'trainerStateClass']) {
    if (!presenter.includes(token)) fail(`Tutorial presenter missing #85 trainer composition: ${token}`);
  }
  for (const forbidden of ['localStorage', 'sessionStorage', 'window.BQ', 'MutationObserver', 'createClient', '@supabase']) {
    if (presenter.includes(forbidden)) fail(`Tutorial presenter bypasses a verified owner during #85: ${forbidden}`);
  }

  for (const token of [
    "url('../../assets/tutorial-trainer-sprite.webp')",
    'background-size:400% 200%',
    '.bq-tutorial-trainer-welcome{background-position:0 0}',
    '.bq-tutorial-trainer-right{background-position:33.333% 0}',
    '.bq-tutorial-trainer-left{background-position:66.666% 0}',
    '.bq-tutorial-trainer-up{background-position:100% 0}',
    '.bq-tutorial-trainer-down{background-position:0 100%}',
    '.bq-tutorial-trainer-thumbs{background-position:33.333% 100%}',
    '.bq-tutorial-trainer-surprise{background-position:66.666% 100%}',
    '.bq-tutorial-trainer-thoughtful{background-position:100% 100%}',
    'width:122px;height:122px',
    '@media(prefers-reduced-motion:reduce)'
  ]) if (!css.includes(token)) fail(`Tutorial CSS missing retained trainer presentation contract: ${token}`);

  if (fs.statSync('assets/tutorial-trainer-sprite.webp').size < 1000) fail('Retained tutorial trainer sprite asset is missing or unexpectedly small.');

  const row85 = inventory.split('\n').find(line => line.startsWith('| 85 |')) || '';
  if (!/\| (Not started|Implemented|Verified|Regression-tested) \|/.test(row85)) fail('Inventory #85 Tutorial avatar reactions must use a valid lifecycle state.');

  for (const test of ['scripts/validate-v3-tutorial-avatar-reactions.mjs', 'tests/v3-tutorial-avatar-reactions-edge.mjs', 'tests/v3-tutorial-avatar-reactions-smoke.mjs']) {
    if (!workflowInvokesNode(workflow, test)) fail(`Accumulated workflow missing #85 regression: ${test}`);
  }
}

if (failures.length) {
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
console.log('BibleQuest v3 Tutorial avatar/trainer reaction architecture boundary passed.');

// BibleQuest V4 Phase 5 contract: expanded first-run tour (Part A) and the
// always-available Help & Tutorial Center (Part B).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

// --- Part A: guided tour ---
const tutorialApp = read('src/app/tutorial.js');
assert.ok(tutorialApp.includes('export const TUTORIAL_STEP_COUNT = 9;'), 'Guided tour must be expanded to 9 steps (within the requested 8-10 range).');

const { STEPS } = await import(path.join(root, 'src', 'features', 'tutorial', 'steps.js'));
assert.equal(STEPS.length, 9, 'Tutorial STEPS content must match TUTORIAL_STEP_COUNT exactly.');
for (const step of STEPS) {
  assert.ok(step.eyebrow && step.title && step.body && step.action?.route && step.action?.label, 'Every tutorial step must have complete content and a real action.');
  assert.ok(step.body.length < 400, `Tutorial step "${step.title}" body is too long for a first-run tour screen (${step.body.length} chars) - detail belongs in the Help Center instead.`);
}
const routes = STEPS.map(s => s.action.route);
for (const required of ['home', 'reader', 'mission', 'assignments', 'play', 'grow', 'more', 'help']) {
  assert.ok(routes.includes(required), `Guided tour must include a step routing to '${required}'.`);
}
const assignmentsStep = STEPS.find(s => s.action.route === 'assignments');
assert.ok(assignmentsStep.body.includes('private') && assignmentsStep.body.includes('cannot see your answer'), 'The Assignments tour step must state the self-only privacy contract in plain language.');

const trainerModule = read('src/features/tutorial/trainer.js');
assert.ok(/TUTORIAL_STEP_TRAINER_STATES = Object\.freeze\(\[[^\]]*\]\)/.test(trainerModule), 'Trainer states array must exist.');
const trainerMatch = trainerModule.match(/TUTORIAL_STEP_TRAINER_STATES = Object\.freeze\((\[[^\]]*\])\)/);
const trainerStates = JSON.parse(trainerMatch[1].replace(/'/g, '"'));
assert.equal(trainerStates.length, 9, 'Trainer state mapping must have exactly one entry per tutorial step.');

// --- Part B: Help & Tutorial Center ---
const helpSrc = read('src/features/help-center/index.js');
const requiredCategories = ['getting-started', 'home', 'bible-learning', 'assignments', 'games', 'grow-progress', 'calendar', 'community', 'couples-family', 'notifications', 'install', 'backup-reset', 'accessibility', 'troubleshooting', 'leader-guide', 'admin-guide'];
for (const id of requiredCategories) {
  assert.ok(helpSrc.includes(`id: '${id}'`), `Help Center is missing the required category: ${id}`);
}
assert.ok(helpSrc.includes('Your submitted assignment answers are private. Other ordinary members cannot see your answer or whether you responded. Authorized ministry leaders may see responses when they need to review the assignment.'), 'Help Center must state the exact required assignment-privacy disclosure.');
assert.ok(helpSrc.includes("data-help-replay-tutorial"), 'Help Center must offer a way back into the guided tour.');
assert.ok(helpSrc.includes('export function helpCenterPage'), 'Help Center must export its page factory.');

// --- Wiring: reachable from both Home... (via the guided tour's final step
// and) More, and routed in bootstrap.js. ---
const bootstrap = read('src/app/bootstrap.js');
assert.ok(bootstrap.includes("import { helpCenterPage } from '../features/help-center/index.js';"), 'bootstrap.js must import the Help Center page.');
assert.ok(bootstrap.includes("help:()=>helpCenterPage("), 'bootstrap.js must register the help route.');
assert.ok(bootstrap.includes('onHelp:()=>router.navigate(\'help\')'), 'More must be wired to navigate to the Help Center.');

const moreSrc = read('src/features/more/index.js');
assert.ok(moreSrc.includes('data-more-help') && moreSrc.includes('data-open-help'), 'More hub must expose a Help Center entry point.');

const iconSprite = read('assets/more-feature-icons.svg');
assert.ok(iconSprite.includes('id="help"'), 'The More-hub icon sprite must include a real help icon, not a blank/missing symbol reference.');

console.log('BibleQuest v4 Phase 5 tutorial expansion and Help Center contract passed.');

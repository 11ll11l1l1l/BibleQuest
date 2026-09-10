import assert from 'node:assert/strict';
import { TRAINER_STATES, TUTORIAL_STEP_TRAINER_STATES, trainerStateClass, trainerStateForStep } from '../src/features/tutorial/trainer.js';

assert.deepEqual(TRAINER_STATES, ['welcome', 'right', 'left', 'up', 'down', 'thumbs', 'surprise', 'thoughtful'], 'All retained 4x2 trainer states must remain addressable.');
assert.deepEqual(TUTORIAL_STEP_TRAINER_STATES, ['welcome', 'down', 'up', 'thumbs', 'thoughtful', 'thumbs'], 'Current tutorial steps must map to the recovered retained trainer states.');

for (const [step, expected] of TUTORIAL_STEP_TRAINER_STATES.entries()) {
  assert.equal(trainerStateForStep(step), expected, `Unexpected trainer state for tutorial step ${step}.`);
  assert.equal(trainerStateClass(step), `bq-tutorial-trainer-${expected}`, `Unexpected trainer class for tutorial step ${step}.`);
}
assert.equal(trainerStateForStep(-1), 'welcome', 'Out-of-range negative tutorial state must fail safely to welcome.');
assert.equal(trainerStateForStep(99), 'welcome', 'Out-of-range tutorial state must fail safely to welcome.');
assert.equal(trainerStateForStep('2'), 'welcome', 'Non-integer tutorial state must fail safely to welcome.');
assert(Object.isFrozen(TRAINER_STATES) && Object.isFrozen(TUTORIAL_STEP_TRAINER_STATES), 'Trainer presentation definitions must remain immutable.');

console.log('BibleQuest v3 Tutorial avatar/trainer reaction edge regression passed.');

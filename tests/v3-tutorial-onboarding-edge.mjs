import assert from 'node:assert/strict';
import { createTutorialService, TUTORIAL_STEP_COUNT } from '../src/app/tutorial.js';

function fakeStorage(initial = null) {
  let value = initial;
  let writes = 0;
  return {
    read(name, fallback) {
      assert.equal(name, 'tutorial-onboarding');
      return value ?? fallback;
    },
    write(name, next) {
      assert.equal(name, 'tutorial-onboarding');
      writes += 1;
      value = structuredClone(next);
      return value;
    },
    value: () => value,
    writes: () => writes
  };
}

const store = fakeStorage();
const tutorial = createTutorialService({ storage: store, now: () => '2026-09-10T15:00:00.000Z' });
assert.equal(tutorial.getState().active, false, 'Tutorial must start closed until a retained trigger or launcher opens it.');
assert.equal(tutorial.getState().completed, false, 'Fresh tutorial state must be incomplete.');

let state = tutorial.open();
assert.equal(state.active, true, 'A fresh onboarding trigger must open the tutorial.');
assert.equal(state.step, 0, 'Fresh onboarding must start at step zero.');
assert.equal(state.totalSteps, TUTORIAL_STEP_COUNT, 'Tutorial must expose its deterministic step count.');

state = tutorial.next();
assert.equal(state.step, 1, 'Next must advance one step.');
state = tutorial.back();
assert.equal(state.step, 0, 'Back must return one step.');
state = tutorial.back();
assert.equal(state.step, 0, 'Back must clamp at the first step.');

state = tutorial.skip();
assert.equal(state.active, false, 'Skip/Close must close the guide.');
assert.equal(state.completed, false, 'Skip/Close must not mark onboarding complete.');
assert.equal(store.writes(), 0, 'Skip/Close must not persist completion.');
state = tutorial.open();
assert.equal(state.active, true, 'An incomplete tutorial must remain reopenable after temporary close.');

state = tutorial.open({ force: true, step: 999 });
assert.equal(state.active, true, 'Force-open must reopen an incomplete tutorial.');
assert.equal(state.step, TUTORIAL_STEP_COUNT - 1, 'Requested step must clamp to the final step.');
state = tutorial.finish();
assert.equal(state.active, false, 'Finish must close the guide.');
assert.equal(state.completed, true, 'Finish must mark onboarding complete.');
assert.equal(state.completedAt, '2026-09-10T15:00:00.000Z', 'Finish must retain completion timestamp.');
assert.equal(store.writes(), 1, 'Finish must persist exactly once.');
assert.equal(store.value().completed, true, 'Persisted completion flag is missing.');

const completed = createTutorialService({ storage: store });
assert.equal(completed.getState().active, false, 'Completed onboarding must start closed on a later page load.');
assert.equal(completed.open().active, false, 'Normal onboarding trigger must respect completed state.');
assert.equal(completed.open({ force: true }).active, true, 'Permanent launcher must force-open even after completion.');

const malformed = createTutorialService({ storage: fakeStorage('not-an-object') });
assert.equal(malformed.getState().completed, false, 'Malformed persisted data must fail closed to incomplete.');
assert.equal(malformed.open().active, true, 'Malformed persisted data must remain recoverable through onboarding.');

assert.throws(() => createTutorialService({ storage: {} }), /shared storage boundary/, 'Tutorial must fail closed without the shared storage owner.');

console.log('BibleQuest v3 Tutorial/onboarding lifecycle edge regression passed.');

import { createStore } from '../src/app/store.js';
import { createProgressService } from '../src/core/progress.js';
import { createLessonEngine } from '../src/engines/lesson.js';
import { createDailyMissionService } from '../src/app/daily-mission.js';
import { selectDailyPassage } from '../src/features/daily-mission/content.js';

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const clone = value => structuredClone(value);

function memoryStorage() {
  const map = new Map();
  let failProgress = false;
  return {
    armProgressFailure() { failProgress = true; },
    read(key, fallback = null) { return map.has(key) ? clone(map.get(key)) : clone(fallback); },
    write(key, value) { if (key === 'progress-state' && failProgress) { failProgress = false; throw new Error('simulated progress write failure'); } map.set(key, clone(value)); return value; },
    remove(key) { map.delete(key); }
  };
}

let now = new Date('2026-09-06T14:59:00Z');
const storage = memoryStorage();
const store = createStore({});
const progress = createProgressService({ storage, store, clock:() => now, timeZone:'Asia/Tokyo' });
const readerCalls = [];
const reader = { setBook(code, chapter) { readerCalls.push({ code, chapter }); } };
const lesson = createLessonEngine({ storage, clock:() => now });
const mission = createDailyMissionService({ lesson, progress, reader, clock:() => now });

assert(storage.read('lesson-sessions', null) === null, 'Lesson store should start empty.');
assert(mission.today().dateKey === '2026-09-06', 'Daily Mission must use the progress service civil-date/timezone boundary.');
assert(storage.read('lesson-sessions', null) === null, 'Home/today preview must not create a lesson session.');
const passage6 = selectDailyPassage('2026-09-06');
const passage7 = selectDailyPassage('2026-09-07');
assert(passage6 !== passage7, 'Adjacent civil dates should advance deterministic Daily Journey rotation.');
let invalidDate = '';
try { selectDailyPassage('2026-02-31'); } catch (error) { invalidDate = error.message; }
assert(/invalid/i.test(invalidDate), 'Invalid civil dates must be rejected deterministically.');
now = new Date('2026-09-06T15:01:00Z');
assert(mission.today().dateKey === '2026-09-07', 'Tokyo midnight boundary did not rotate the Daily Journey date.');

now = new Date('2026-09-06T03:00:00Z');
let opened = mission.open();
assert(opened.state.totalSteps === 5 && opened.state.currentStep.id === 'retrieve', 'Daily Journey must open the five-step lesson at Retrieve.');
mission.respond(0);
assert(progress.getState().xp === 12 && progress.getState().totalActivities === 1, 'Retrieve must emit exactly one meaningful +12 XP progress event.');
mission.respond(0);
assert(progress.getState().xp === 12, 'Duplicate Retrieve response double-awarded XP.');
mission.advance();
assert(mission.getState().state.currentStep.id === 'context', 'Daily Journey did not advance to Context.');
mission.prepareReader();
assert(readerCalls.length === 1 && readerCalls[0].code === opened.passage.code && readerCalls[0].chapter === opened.passage.chapter, 'Context reader handoff did not use the existing reader owner.');
mission.respond(true); mission.advance();
assert(mission.getState().state.currentStep.id === 'learn' && progress.getState().xp === 20, 'Context completion contract failed.');
mission.respond(true); mission.advance();
mission.respond('Take one concrete action today.'); mission.advance();
mission.respond('Remember and obey the passage today.');
assert(progress.getState().xp === 44 && progress.getState().totalActivities === 5, 'Five Daily Journey steps must total 44 XP and five meaningful activities.');
const finished = mission.advance();
assert(finished.state.status === 'complete' && progress.getState().xp === 69, 'Daily Journey completion must add exactly one +25 XP bonus.');
assert(progress.getState().totalActivities === 5, 'Completion bonus must not count as a sixth meaningful activity.');
mission.advance();
assert(progress.getState().xp === 69, 'Repeated completion duplicated Daily Journey bonus.');
mission.close();
opened = mission.open();
assert(opened.resumed && opened.state.status === 'complete' && progress.getState().xp === 69, 'Completed Daily Journey did not resume without duplicate awards.');
mission.close();

now = new Date('2026-09-07T03:00:00Z');
const nextDay = mission.open();
assert(nextDay.dateKey === '2026-09-07' && !nextDay.resumed && nextDay.state.currentStep.id === 'retrieve', 'A new civil date must open an independent fresh Daily Journey.');
mission.respond(0);
assert(progress.getState().xp === 81 && progress.getState().streak === 2, 'Next-day Daily Journey must continue streak and award only its new step.');
mission.close();

const failureStorage = memoryStorage();
const failureStore = createStore({});
const failureNow = new Date('2026-09-08T03:00:00Z');
const failureProgress = createProgressService({ storage:failureStorage, store:failureStore, clock:() => failureNow, timeZone:'Asia/Tokyo' });
const failureLesson = createLessonEngine({ storage:failureStorage, clock:() => failureNow });
const failureMission = createDailyMissionService({ lesson:failureLesson, progress:failureProgress, reader, clock:() => failureNow });
failureMission.open();
failureStorage.armProgressFailure();
let writeError = '';
try { failureMission.respond(0); } catch (error) { writeError = error.message; }
assert(/simulated progress write failure/i.test(writeError), 'Simulated cross-service progress failure did not surface.');
assert(failureProgress.getState().xp === 0, 'Failed progress write partially mutated progress state.');
failureMission.close();
const healed = failureMission.open();
assert(healed.state.responses.retrieve === 0 && failureProgress.getState().xp === 12, 'Reopen did not reconcile persisted lesson response into exactly one progress event.');
failureMission.close();

console.log('BibleQuest v3 Daily Mission edge regression passed.');

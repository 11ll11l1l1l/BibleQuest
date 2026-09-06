import { createLessonEngine } from '../src/engines/lesson.js';

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const clone = value => structuredClone(value);
const memory = new Map();
const storage = { read(key, fallback = null) { return memory.has(key) ? clone(memory.get(key)) : clone(fallback); }, write(key, value) { memory.set(key, clone(value)); return value; } };
let now = new Date('2026-09-06T09:00:00Z');
const definition = {
  id: 'engine.acceptance', version: 1, title: 'Engine Acceptance',
  steps: [
    { id: 'intro', type: 'content', prompt: 'Read the introduction.' },
    { id: 'choice', type: 'choice', prompt: 'Choose the correct answer.', choices: ['Wrong', 'Correct', 'Other'], answer: 1, reference: 'John 3:16', feedback: { correct: 'Correct feedback', incorrect: 'Review feedback' } },
    { id: 'confirm', type: 'confirm', prompt: 'Confirm that you reviewed the context.', feedback: { response: 'Context reviewed' } },
    { id: 'reflect', type: 'text', prompt: 'Write one reflection.', maxLength: 80, feedback: { response: 'Reflection saved' } }
  ]
};
const engine = createLessonEngine({ storage, clock: () => new Date(now) });
const opened = engine.open(definition);
assert(!opened.resumed && opened.state.index === 0 && opened.state.currentStep.id === 'intro', 'Lesson engine did not start at the first step.');
assert(!('answer' in opened.state.currentStep), 'Public lesson step leaked the private correct-answer index.');
let contentResponseError = '';
try { engine.respond('anything'); } catch (error) { contentResponseError = error.message; }
assert(/does not accept/i.test(contentResponseError), 'Content step incorrectly accepted a response.');
engine.advance();
assert(engine.getState().currentStep.id === 'choice', 'Content step did not advance.');
let advanceEarly = '';
try { engine.advance(); } catch (error) { advanceEarly = error.message; }
assert(/complete the current/i.test(advanceEarly), 'Engine advanced past unanswered interactive step.');
const answer = engine.respond(1);
assert(answer.feedback.correct === true && answer.state.score.answered === 1 && answer.state.score.evaluated === 1 && answer.state.score.correct === 1, 'Scored choice response was not evaluated correctly.');
const duplicate = engine.respond(1);
assert(duplicate.duplicate && engine.getState().score.correct === 1, 'Repeated identical response changed score.');
let lockedError = '';
try { engine.respond(0); } catch (error) { lockedError = error.message; }
assert(/already answered/i.test(lockedError), 'Conflicting second response was not blocked.');

const persisted = memory.get('lesson-sessions');
persisted.sessions[definition.id].feedback.choice = { correct: false, message: 'tampered', reference: '' };
memory.set('lesson-sessions', persisted);
const reloaded = createLessonEngine({ storage, clock: () => new Date(now) });
const resumed = reloaded.open(definition);
assert(resumed.resumed && resumed.state.index === 1 && resumed.state.responses.choice === 1, 'Lesson did not resume persisted response/position.');
assert(resumed.state.feedback.choice.correct === true && resumed.state.feedback.choice.message === 'Correct feedback' && resumed.state.score.correct === 1, 'Resume trusted stale/tampered feedback instead of reconstructing it from definition + response.');
reloaded.advance();
let falseConfirm = '';
try { reloaded.respond(false); } catch (error) { falseConfirm = error.message; }
assert(/confirm/i.test(falseConfirm), 'Confirmation step accepted false.');
reloaded.respond(true);
reloaded.advance();
let emptyText = '';
try { reloaded.respond('   '); } catch (error) { emptyText = error.message; }
assert(/required/i.test(emptyText), 'Text step accepted an empty response.');
reloaded.respond('One concrete reflection.');
now = new Date('2026-09-06T09:05:00Z');
const completed = reloaded.advance();
assert(completed.completed && !completed.duplicate && completed.state.status === 'complete' && completed.completion.lessonId === definition.id, 'Lesson completion contract failed.');
assert(completed.state.score.answered === 3 && completed.state.score.evaluated === 1 && completed.state.score.correct === 1, 'Lesson completion score is wrong.');
const completedAgain = reloaded.advance();
assert(completedAgain.completed && completedAgain.duplicate, 'Repeated completion advance was not idempotent.');
reloaded.close();
let closedError = '';
try { reloaded.getState(); } catch (error) { closedError = error.message; }
assert(/open a lesson/i.test(closedError), 'Lesson teardown left an active in-memory session.');
const reopenedComplete = reloaded.open(definition);
assert(reopenedComplete.resumed && reopenedComplete.state.status === 'complete', 'Completed lesson did not reopen from persisted state.');
const restarted = reloaded.restart();
assert(restarted.state.status === 'active' && restarted.state.index === 0 && Object.keys(restarted.state.responses).length === 0, 'Lesson restart did not reset persisted lifecycle state.');

const version2 = { ...definition, version: 2 };
const versionReset = reloaded.open(version2);
assert(!versionReset.resumed && versionReset.state.definitionVersion === 2 && versionReset.state.index === 0, 'Lesson definition version change did not reset stale session state.');
let duplicateStepError = '';
try { reloaded.open({ id: 'bad.lesson', version: 1, steps: [{ id: 'same', type: 'content', prompt: 'One' }, { id: 'same', type: 'content', prompt: 'Two' }] }); } catch (error) { duplicateStepError = error.message; }
assert(/unique stable id/i.test(duplicateStepError), 'Duplicate lesson step ids were not rejected.');

const flakyMemory = new Map();
let failWrite = false;
const flakyStorage = { read(key, fallback = null) { return flakyMemory.has(key) ? clone(flakyMemory.get(key)) : clone(fallback); }, write(key, value) { if (failWrite) { failWrite = false; throw new Error('simulated lesson persistence failure'); } flakyMemory.set(key, clone(value)); return value; } };
const flaky = createLessonEngine({ storage: flakyStorage, clock: () => new Date('2026-09-06T10:00:00Z') });
flaky.open({ id: 'atomic.lesson', version: 1, steps: [{ id: 'answer', type: 'choice', prompt: 'Choose.', choices: ['A', 'B'], answer: 1 }] });
failWrite = true;
let writeError = '';
try { flaky.respond(1); } catch (error) { writeError = error.message; }
assert(/simulated/i.test(writeError) && Object.keys(flaky.getState().responses).length === 0, 'Failed lesson persistence mutated in-memory session state.');
const retry = flaky.respond(1);
assert(retry.applied && retry.state.score.correct === 1, 'Lesson response could not recover after storage failure.');

const corruptStorage = { read() { return { version: 1, sessions: { 'engine.acceptance': { definitionVersion: 1, status: 'active', index: 1, responses: { choice: 1 }, feedback: {}, startedAt: 'bad-date', updatedAt: 'also-bad' } } }; }, write(key, value) { this.saved = clone(value); return value; } };
const recovered = createLessonEngine({ storage: corruptStorage }).open(definition);
assert(!recovered.resumed && recovered.state.index === 0, 'Malformed persisted lesson session did not recover to a fresh lifecycle.');
console.log('BibleQuest v3 lesson engine edge regression passed.');

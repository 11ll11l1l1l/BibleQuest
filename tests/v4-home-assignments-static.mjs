import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve(import.meta.dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const home=read('src/features/home/index.js');
const bootstrap=read('src/app/bootstrap.js');
const css=read('src/ui/home-v4.css');

for(const hook of ['data-home-assignments','data-home-assignments-all','data-home-assignment-open','data-home-assignment-status']){
  assert.ok(home.includes(hook),`Home Assignments integration must expose ${hook}.`);
}

assert.ok(home.includes('assignments?.load'), 'Home must load through the existing Assignments owner.');
assert.ok(home.includes('assignments?.open'), 'Home direct task action must open through the existing Assignments owner.');
assert.ok(home.includes('onAssignments?.()'), 'Home assignment actions must navigate into the existing Assignments route.');
assert.ok(!home.includes('createAssignmentsService'), 'Home must never construct a second Assignments service.');

const ownerMatches=bootstrap.match(/const assignments=createAssignmentsService\(/g)||[];
assert.equal(ownerMatches.length,1,'Bootstrap must continue to construct exactly one Assignments service owner.');
assert.ok(/home:\(\)=>homePage\(\{[^\n}]*assignments[^\n}]*onAssignments:\(\)=>router\.navigate\('assignments'\)/.test(bootstrap),'Home must receive the existing singleton Assignments owner and existing route action.');
assert.ok(bootstrap.includes("assignments:()=>assignmentsPage({assignments"),'The full Assignments page must use the same singleton owner.');

// Home is a summary only. It must not render private member answer text or leader feedback.
for(const forbidden of ['submission','leaderFeedback','activeReview','responses']){
  assert.ok(!home.includes(`item.${forbidden}`),`Home must not project private Assignments field ${forbidden}.`);
}
assert.ok(home.includes("row?.progress?.status !== 'completed'"),'Completed tasks must be excluded from the active Home assignment list.');
assert.ok(home.includes("row?.dueState !== 'scheduled'"),'Not-yet-open scheduled tasks must be excluded from the active Home assignment list.');
for(const state of ['overdue','due-soon','in-progress','pending']) assert.ok(home.includes(`key:'${state}'`),`Home must support visible ${state} assignment state.`);

assert.ok(/\.bq-home-assignments\{/.test(css),'Home assignment card must have a dedicated V4 presentation.');
assert.ok(/\[data-home-assignments\]\{grid-column:1\/-1\}/.test(css),'Home assignments must remain prominent and full-width in the desktop dashboard.');
assert.ok(css.includes('min-height:88px'),'Home assignment rows must provide a large touch target.');
assert.ok(/@media\(max-width:390px\)/.test(css),'Home assignment card must protect compact-phone layout.');
assert.ok(/@media\(prefers-reduced-motion:reduce\)/.test(css),'Home assignment interactions must honor reduced motion.');
assert.ok(/@media\(prefers-contrast:more\)/.test(css),'Home assignment states must support increased contrast.');

console.log('BibleQuest v4 Home Assignments single-owner/static contract passed.');

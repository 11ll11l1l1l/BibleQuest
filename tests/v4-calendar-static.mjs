// BibleQuest V4 Calendar acceptance contract.
// Calendar V4 is a presentation/certification tranche. The existing Calendar
// service and feature owner remain byte-exact while the accumulated V4 gate
// proves responsive, accessible presentation and keeps the older browser
// regressions in force.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const baselineSha='844ba32b00c95c34ad101b18f9195789ae79762a';
const preserved=[
  'src/app/calendar.js',
  'src/features/calendar/index.js'
];

for(const relative of preserved){
  const current=fs.readFileSync(path.join(root,relative),'utf8');
  const baseline=execFileSync('git',['show',`${baselineSha}:${relative}`],{cwd:root,encoding:'utf8'});
  assert.equal(current,baseline,`${relative} must remain byte-for-byte unchanged in the V4 Calendar certification tranche.`);
}

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'src/ui/journey-v4.css'),'utf8');
const feature=fs.readFileSync(path.join(root,'src/features/calendar/index.js'),'utf8');
const service=fs.readFileSync(path.join(root,'src/app/calendar.js'),'utf8');
const smoke=fs.readFileSync(path.join(root,'tests/v3-calendar-smoke.mjs'),'utf8');
const phaseB=fs.readFileSync(path.join(root,'tests/v3-calendar-phase-b-smoke.mjs'),'utf8');
const workflow=fs.readFileSync(path.join(root,'.github/workflows/v3-regression.yml'),'utf8');

assert.ok(html.includes('src/ui/calendar.css'),'Base Calendar stylesheet must remain active.');
assert.ok(html.includes('src/ui/calendar-phase-b.css'),'Calendar Phase B stylesheet must remain active.');
assert.ok(html.includes('src/ui/journey-v4.css'),'V4 Journey/Calendar stylesheet must remain active.');
assert.ok(html.indexOf('src/ui/journey-v4.css')>html.indexOf('src/ui/calendar-phase-b.css'),'V4 Calendar overrides must load after the certified Calendar layers.');

for(const selector of[
  '[data-calendar-page]',
  '.bq-calendar-intro',
  'form[data-calendar-add]',
  '.bq-calendar-day',
  '.bq-calendar-event',
  '.bq-calendar-event-actions',
  '.bq-calendar-empty',
  '.bq-calendar-icon-wrap--hero'
]) assert.ok(css.includes(selector),`V4 Calendar presentation must cover ${selector}.`);

assert.ok(css.includes('@media(max-width:760px)'),'V4 Calendar must include mobile form composition.');
assert.ok(css.includes('@media(max-width:390px)'),'V4 Calendar must explicitly cover the 390px phone target.');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),'V4 Calendar must preserve reduced-motion presentation.');
assert.ok(css.includes('@media(prefers-contrast:more)'),'V4 Calendar must preserve stronger-contrast presentation.');
assert.ok(!/https?:\/\//.test(css),'V4 Journey/Calendar presentation must not introduce remote assets.');

for(const hook of[
  'data-calendar-page',
  'data-calendar-add',
  'data-calendar-share',
  'data-calendar-recurrence',
  'data-calendar-edit',
  'data-calendar-remove-congregation',
  'data-calendar-remove',
  'data-calendar-back'
]) assert.ok(feature.includes(hook),`Calendar feature owner must preserve ${hook}.`);

assert.ok(service.includes('assignments?.snapshot?.()'),'Calendar must continue aggregating assignment due dates through the Assignments owner.');
assert.ok(service.includes("congregation.can(active.congregationId, 'ministry')"),'Calendar must derive congregation sharing permission from the Congregation owner.');
assert.ok(service.includes("congregation.assert(congregationState.congregationId, 'ministry')"),'Calendar must enforce ministry permission before publishing shared events.');
assert.ok(service.includes('current.ownerId !== userId'),'Calendar must preserve creator-only shared-event mutation checks.');
assert.ok(service.includes('api.calendar.listCongregation')&&service.includes('api.calendar.createCongregation')&&service.includes('api.calendar.updateCongregation')&&service.includes('api.calendar.removeCongregation'),'Calendar must keep congregation persistence behind the existing API boundary.');
assert.ok(!/\bfetch\s*\(/.test(service),'Calendar service must not bypass the API boundary with direct fetch calls.');

for(const token of[
  "viewport:{width:390,height:844}",
  'Read Mark 1',
  'Other leader event',
  'recurrenceInputBeforeCheck',
  'ownerEditCount',
  'ownerDeleteCount',
  'scrollWidth<=result.metrics.innerWidth+1',
  'addButtonHeight>=44'
]) assert.ok(smoke.includes(token),`Existing Calendar browser regression must preserve ${token}.`);

for(const token of[
  'calendar-feature-icons.svg',
  "['planner','personal','assignment','congregation','empty']",
  'new Set(result.eventHrefs).size===3',
  'scrollWidth<=result.metrics.innerWidth+1',
  'minTarget>=44'
]) assert.ok(phaseB.includes(token),`Calendar Phase B browser acceptance must preserve ${token}.`);

assert.ok(workflow.includes('tests/v4-calendar-static.mjs'),'Accumulated edge CI must run the V4 Calendar acceptance contract.');
assert.ok(workflow.includes('tests/v3-calendar-smoke.mjs'),'Accumulated browser CI must retain the Calendar functional regression.');
assert.ok(workflow.includes('tests/v3-calendar-phase-b-smoke.mjs'),'Accumulated browser CI must retain the Calendar artwork/mobile regression.');

console.log('BibleQuest v4 Calendar static acceptance contract passed.');
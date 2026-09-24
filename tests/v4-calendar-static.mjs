// BibleQuest V4/V5 Calendar structural acceptance contract.
// V5 legitimately extends Calendar with active-congregation selection, a
// 42-day month grid, and localized chrome. Preserve the V4 ownership/security/
// accessibility invariants without freezing the pre-V5 implementation bytes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve(import.meta.dirname,'..');
const service=fs.readFileSync(path.join(root,'src/app/calendar.js'),'utf8');
const feature=fs.readFileSync(path.join(root,'src/features/calendar/index.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'src/ui/journey-v4.css'),'utf8');
const smoke=fs.readFileSync(path.join(root,'tests/v3-calendar-smoke.mjs'),'utf8');
const phaseB=fs.readFileSync(path.join(root,'tests/v3-calendar-phase-b-smoke.mjs'),'utf8');
const workflow=fs.readFileSync(path.join(root,'.github/workflows/v3-regression.yml'),'utf8');

// Calendar remains one app/service owner behind Session, private storage,
// Congregation, Assignments and the shared API boundary.
for(const token of[
  'export function createCalendarService({ session, privateStorage, api, assignments, congregation, clock = () => new Date() })',
  'assignments?.snapshot?.()',
  'congregation.getActive?.() || memberships[0]',
  "congregation.can(active.congregationId, 'ministry')",
  "congregation.assert(shared.congregationId, 'ministry')",
  'current.ownerId !== userId',
  'api.calendar.listCongregation',
  'api.calendar.createCongregation',
  'api.calendar.updateCongregation',
  'api.calendar.removeCongregation',
  'function getAgenda({ startDate = clock(), days = 30 } = {})',
  'return Object.freeze({ load, addEvent, updateCongregationEvent, removeCongregationEvent, removeEvent, getAgenda, getState: present })'
]) assert.ok(service.includes(token),`Calendar service must retain structural contract: ${token}`);
assert.ok(!/\bfetch\s*\(/.test(service),'Calendar service must not bypass the API boundary with direct fetch calls.');
assert.ok(!/supabase\.co|service[_-]?role|sb_secret_/i.test(service),'Calendar owner must not embed privileged backend credentials.');

// V5 localization and month-grid work must extend the certified feature owner,
// not create a second calendar runtime.
assert.ok(feature.includes("import { localization } from '../../app/localization.js'"),'Calendar must use the integrated localization owner.');
assert.ok(feature.includes("title:tx('nav.calendar')"),'Calendar route title must be localized through the shared owner.');
for(const key of['calendar.form.eventTitle','calendar.form.eventDate','calendar.month.aria','calendar.month.previous','calendar.month.next','calendar.month.today'])assert.ok(feature.includes(key),`Calendar must retain localized accessibility/UI key: ${key}.`);
for(const hook of[
  'data-calendar-page',
  'data-calendar-add',
  'data-calendar-share',
  'data-calendar-recurrence',
  'data-calendar-edit',
  'data-calendar-remove-congregation',
  'data-calendar-remove',
  'data-calendar-back',
  'data-calendar-month-prev',
  'data-calendar-month-next',
  'data-calendar-today',
  'data-calendar-day'
]) assert.ok(feature.includes(hook),`Calendar feature owner must preserve ${hook}.`);
assert.ok(feature.includes('Array.from({length:42}'),'V5 Calendar month grid must retain the complete six-week horizon.');
assert.ok(feature.includes('calendar.getAgenda?.({startDate:start,days:42})'),'V5 month grid must request its explicit 42-day agenda window from the Calendar owner.');
assert.ok(feature.includes('aria-pressed=')&&feature.includes('role="grid"'),'Month selection must retain keyboard/assistive-technology state semantics.');

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

assert.ok(workflow.includes('tests/v4-calendar-static.mjs'),'Accumulated edge CI must run the V4/V5 Calendar acceptance contract.');
assert.ok(workflow.includes('tests/v3-calendar-smoke.mjs'),'Accumulated browser CI must retain the Calendar functional regression.');
assert.ok(workflow.includes('tests/v3-calendar-phase-b-smoke.mjs'),'Accumulated browser CI must retain the Calendar artwork/mobile regression.');

console.log('BibleQuest v4/v5 Calendar structural acceptance contract passed.');

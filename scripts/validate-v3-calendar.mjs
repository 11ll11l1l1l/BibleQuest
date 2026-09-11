import fs from 'node:fs';
import {workflowInvokesNode} from './v3-workflow-contract.mjs';
const failures=[],fail=message=>failures.push(message),read=file=>fs.readFileSync(file,'utf8');
const required=['CALENDAR_V3.md','src/engines/calendar.js','src/app/calendar.js','src/features/calendar/index.js','src/features/more/index.js','src/app/assignments.js','src/core/api.js','src/app/bootstrap.js','supabase/migrations/20260911_calendar_events.sql','tests/v3-calendar-edge.mjs','tests/v3-calendar-smoke.mjs','.github/workflows/v3-regression.yml'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing Calendar file: ${file}`);
if(!failures.length){
  const contract=read('CALENDAR_V3.md'),engine=read('src/engines/calendar.js'),service=read('src/app/calendar.js'),ui=read('src/features/calendar/index.js'),more=read('src/features/more/index.js'),api=read('src/core/api.js'),bootstrap=read('src/app/bootstrap.js'),migration=read('supabase/migrations/20260911_calendar_events.sql'),workflow=read('.github/workflows/v3-regression.yml');

  for(const forbidden of['window.BQ','createClient','@supabase','document.','localStorage','sessionStorage'])if(engine.includes(forbidden))fail(`Calendar engine leaked an external owner: ${forbidden}`);
  for(const token of['normalizeEvent','fromAssignmentDue','buildAgenda','ownerId'])if(!engine.includes(token))fail(`Calendar engine missing contract token: ${token}`);

  for(const forbidden of['window.BQ','createClient','@supabase','document.'])if(service.includes(forbidden))fail(`Calendar service bypasses verified owners: ${forbidden}`);
  for(const token of['session.getState','privateStorage.read','privateStorage.write','api.calendar','assignments','BQ_CALENDAR_INPUT','updateCongregationEvent','removeCongregationEvent','BQ_CALENDAR_NOT_OWNER'])if(!service.includes(token))fail(`Calendar service missing lifecycle contract: ${token}`);
  if(/\.from\(['"]bible_assignment/.test(service))fail('Calendar service must not query Assignments tables directly; it must reuse the Assignments owner.');

  for(const forbidden of['createClient','@supabase','localStorage','sessionStorage'])if(ui.includes(forbidden))fail(`Calendar UI bypasses verified owners: ${forbidden}`);
  for(const token of['data-calendar-add','data-calendar-back','data-calendar-remove','data-calendar-edit','data-calendar-remove-congregation','calendar.load','calendar.addEvent','calendar.removeEvent','calendar.updateCongregationEvent','calendar.removeCongregationEvent'])if(!ui.includes(token))fail(`Calendar UI missing presentation contract: ${token}`);

  for(const token of['data-open-calendar','onCalendar'])if(!more.includes(token))fail(`More page missing Calendar entry: ${token}`);

  for(const token of['createCalendarService','calendarPage',"calendar:()=>calendarPage","onCalendar:()=>router.navigate('calendar')"])if(!bootstrap.includes(token))fail(`Bootstrap missing Calendar composition: ${token}`);

  for(const token of['calendar','bible_calendar_events','CALENDAR_CONGREGATION_EVENT_FIELDS','updateCongregation','removeCongregation'])if(!api.includes(token))fail(`API boundary missing Calendar composition: ${token}`);

  if(!/create table if not exists public\.bible_calendar_events/.test(migration))fail('Calendar migration must create bible_calendar_events additively.');
  if(!/user_id=\(select auth\.uid\(\)\)/.test(migration))fail('Calendar migration must scope RLS to the owning user.');
  for(const policy of['calendar events self update','calendar events self delete'])if(!migration.includes(policy))fail(`Calendar owner mutation must reuse the existing own-row RLS policy: ${policy}`);

  for(const token of['personal reminders','assignment due-date aggregation','Congregation-shared','own-row RLS','owner-only edit/delete','creation-only notification'])if(!contract.includes(token))fail(`Calendar contract missing recorded scope boundary: ${token}`);

  for(const test of['scripts/validate-v3-calendar.mjs','tests/v3-calendar-edge.mjs','tests/v3-calendar-smoke.mjs'])if(!workflowInvokesNode(workflow,test))fail(`Accumulated workflow missing Calendar regression: ${test}`);
}
if(failures.length){failures.forEach(item=>console.error(`- ${item}`));process.exit(1)}
console.log('BibleQuest v3 Calendar architecture/ownership boundary passed.');
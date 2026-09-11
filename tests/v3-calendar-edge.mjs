import assert from 'node:assert/strict';
import { normalizeEvent, fromAssignmentDue, buildAgenda } from '../src/engines/calendar.js';
import { createCalendarService } from '../src/app/calendar.js';

// --- engine ---
assert.equal(normalizeEvent({ eventDate: 'not-a-date', title: 'X' }), null, 'Invalid date must fail closed to null.');
assert.equal(normalizeEvent({ eventDate: '2026-09-20', title: '   ' }), null, 'Blank title must fail closed to null.');
let event = normalizeEvent({ id: 'a1', eventDate: '2026-09-20', title: 'Bible study' });
assert.equal(event.source, 'personal', 'Unspecified source must default to personal.');
assert.equal(event.date, '2026-09-20', 'Date must normalize to YYYY-MM-DD.');

assert.equal(fromAssignmentDue({ id: '1', title: 'Read John 3', dueAt: null }), null, 'Assignment without a due date must produce no calendar event.');
const dueEvent = fromAssignmentDue({ id: '1', title: 'Read John 3', dueAt: '2026-09-25T00:00:00.000Z', dueState: 'overdue' });
assert.equal(dueEvent.source, 'assignment', 'Assignment-derived events must be tagged as assignment source.');
assert.match(dueEvent.title, /Read John 3/, 'Assignment event title must include the assignment title.');
assert.equal(dueEvent.notes, 'Overdue', 'Overdue assignments must be flagged in the event notes.');

const agenda = buildAgenda([
  { eventDate: '2026-09-11', title: 'Prayer meeting', source: 'personal' },
  { eventDate: '2026-09-11', title: 'Due: Reading', source: 'assignment' },
  { eventDate: '2026-09-09', title: 'Out of range (past)', source: 'personal' },
  { eventDate: '2026-10-20', title: 'Out of range (too far)', source: 'personal' }
], { today: new Date('2026-09-11T00:00:00.000Z'), days: 30 });
assert.equal(agenda.length, 1, 'Agenda must exclude events outside the requested window.');
assert.equal(agenda[0].date, '2026-09-11');
assert.equal(agenda[0].events.length, 2, 'Same-day events must all be grouped together.');
assert.equal(agenda[0].events[0].source, 'assignment', 'Assignment items must sort before personal items on the same day.');

// --- service ---
function memoryPrivateStorage(){
  const map=new Map();
  return { read(name,fallback=null){return map.has(name)?map.get(name):fallback}, write(name,value){map.set(name,value);return value}, remove(name){map.delete(name)} };
}
function fakeApi(){
  const rows=[];
  return { calendar:{
    async list(){ return rows.slice(); },
    async create(userId,ev){ const row={id:`cloud-${rows.length+1}`,user_id:userId,title:ev.title,notes:ev.notes,event_date:ev.date,all_day:ev.allDay}; rows.push(row); return row; },
    async remove(userId,id){ const i=rows.findIndex(r=>r.id===id); if(i>=0)rows.splice(i,1); return true; }
  }, __rows: rows };
}

const guestStorage=memoryPrivateStorage();
const guestSession={getState:()=>({authenticated:false,user:null})};
const guestApi=fakeApi();
const guestAssignments={snapshot:()=>({assignments:[]})};
let calendar=createCalendarService({session:guestSession,privateStorage:guestStorage,api:guestApi,assignments:guestAssignments,clock:()=>new Date('2026-09-11T00:00:00.000Z')});
let state=await calendar.load();
assert.equal(state.owner,'guest');
assert.equal(state.scope,'guest-device');
state=await calendar.addEvent({title:'Read Psalms',eventDate:'2026-09-12'});
assert.equal(guestApi.__rows.length,0,'Guest events must never reach the API boundary.');
assert.equal(state.events.length,1,'Guest add must apply locally.');

await assert.rejects(()=>calendar.addEvent({title:'',eventDate:'2026-09-12'}),/valid date|title/i,'Blank title must be rejected.');

const acctStorage=memoryPrivateStorage();
const acctSession={getState:()=>({authenticated:true,user:{id:'edge-user-1'}})};
const acctApi=fakeApi();
const acctAssignments={snapshot:()=>({assignments:[{id:'a1',title:'Read Mark 1',dueAt:'2026-09-15T00:00:00.000Z',dueState:'assigned'}]})};
calendar=createCalendarService({session:acctSession,privateStorage:acctStorage,api:acctApi,assignments:acctAssignments,clock:()=>new Date('2026-09-11T00:00:00.000Z')});
state=await calendar.load();
assert.equal(state.scope,'account-cloud');
const withAssignment=state.agenda.find(day=>day.date==='2026-09-15');
assert.ok(withAssignment,'Assignment due date must appear in the agenda without Calendar writing to Assignments.');
state=await calendar.addEvent({title:'Family devotion',eventDate:'2026-09-16'});
assert.equal(acctApi.__rows.length,1,'Authenticated add must sync through the API boundary.');
assert.equal(state.synced,true);
const removed=await calendar.removeEvent(state.events[0].id);
assert.equal(acctApi.__rows.length,0,'Authenticated remove must sync through the API boundary.');
assert.equal(removed.synced,true);

const failingApi={ calendar:{ async list(){return[]}, async create(){throw new Error('down')}, async remove(){throw new Error('down')} } };
calendar=createCalendarService({session:acctSession,privateStorage:memoryPrivateStorage(),api:failingApi,assignments:acctAssignments,clock:()=>new Date('2026-09-11T00:00:00.000Z')});
await calendar.load();
const failResult=await calendar.addEvent({title:'Offline add',eventDate:'2026-09-17'});
assert.equal(failResult.events.length,1,'Local add must still apply when cloud sync fails.');
assert.equal(failResult.synced,false,'Failed cloud sync must be reported, not swallowed.');

console.log('BibleQuest v3 Calendar edge regression passed.');

import assert from 'node:assert/strict';
import { normalizeEvent, fromAssignmentDue, buildAgenda, expandRecurring } from '../src/engines/calendar.js';
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

// --- engine: congregation source + weekly recurrence ---
const congEvent = normalizeEvent({ id: 'c1', source: 'congregation', user_id: 'leader-1', eventDate: '2026-09-11', title: 'Prayer meeting', recurrenceWeeks: 2 });
assert.equal(congEvent.recurrenceWeeks, 2);
assert.equal(congEvent.ownerId, 'leader-1', 'Shared-event creator identity must survive normalization for owner-only controls.');
const personalRecurrence = normalizeEvent({ id: 'p1', source: 'personal', eventDate: '2026-09-11', title: 'x', recurrenceWeeks: 5 });
assert.equal(personalRecurrence.recurrenceWeeks, 0, 'Personal events must never carry recurrence; only congregation events can.');
const occurrences = expandRecurring(congEvent);
assert.equal(occurrences.length, 3, 'recurrenceWeeks:2 must expand to the original plus 2 weekly occurrences.');
assert.deepEqual(occurrences.map(o => o.date), ['2026-09-11', '2026-09-18', '2026-09-25']);
assert.equal(occurrences[1].id, 'c1:occurrence-1');
assert.equal(occurrences[1].ownerId, 'leader-1', 'Generated recurrence occurrences must preserve creator identity.');
assert.equal(occurrences[1].recurrenceWeeks, 0, 'An expanded occurrence must not itself carry a recurrence count (no re-expansion).');
assert.deepEqual(expandRecurring(normalizeEvent({ id: 'n1', eventDate: '2026-09-11', title: 'no repeat' })).map(o => o.id), ['n1'], 'recurrenceWeeks:0 must expand to just the original event.');
assert.deepEqual(expandRecurring(null), [], 'expandRecurring must fail closed on null input.');

const recurringAgenda = buildAgenda([congEvent], { today: new Date('2026-09-11T00:00:00.000Z'), days: 30 });
assert.equal(recurringAgenda.length, 3, 'A recurring congregation event must produce one agenda day per occurrence within the window.');

const sortAgenda = buildAgenda([
  { eventDate: '2026-09-11', title: 'Personal', source: 'personal' },
  { eventDate: '2026-09-11', title: 'Congregation', source: 'congregation' },
  { eventDate: '2026-09-11', title: 'Assignment', source: 'assignment' }
], { today: new Date('2026-09-11T00:00:00.000Z'), days: 30 });
assert.deepEqual(sortAgenda[0].events.map(e => e.source), ['assignment', 'congregation', 'personal'], 'Same-day sort order must be assignment, then congregation, then personal.');

// --- service ---
function memoryPrivateStorage(){
  const map=new Map();
  return { read(name,fallback=null){return map.has(name)?map.get(name):fallback}, write(name,value){map.set(name,value);return value}, remove(name){map.delete(name)} };
}
function fakeApi(){
  const rows=[];
  const congregationRows=[];
  const calls={updates:0,removals:0};
  return { calendar:{
    async list(){ return rows.slice(); },
    async create(userId,ev){ const row={id:`cloud-${rows.length+1}`,user_id:userId,title:ev.title,notes:ev.notes,event_date:ev.date,all_day:ev.allDay}; rows.push(row); return row; },
    async remove(userId,id){ const i=rows.findIndex(r=>r.id===id&&r.user_id===userId); if(i>=0)rows.splice(i,1); return true; },
    async listCongregation(congregationId){ return congregationRows.filter(r=>r.congregation_id===congregationId); },
    async createCongregation(userId,congregationId,ev){ const row={id:`cong-${congregationRows.length+1}`,congregation_id:congregationId,user_id:userId,title:ev.title,notes:ev.notes,event_date:ev.date,all_day:ev.allDay,recurrence_weeks:ev.recurrenceWeeks||0}; congregationRows.push(row); return row; },
    async updateCongregation(userId,congregationId,id,ev){ calls.updates++; const row=congregationRows.find(r=>r.id===id&&r.user_id===userId&&r.congregation_id===congregationId); if(!row)return null; Object.assign(row,{title:ev.title,notes:ev.notes,event_date:ev.date,all_day:ev.allDay,recurrence_weeks:ev.recurrenceWeeks||0}); return {...row}; },
    async removeCongregation(userId,congregationId,id){ calls.removals++; const i=congregationRows.findIndex(r=>r.id===id&&r.user_id===userId&&r.congregation_id===congregationId); if(i<0)return null; const [row]=congregationRows.splice(i,1); return {id:row.id}; }
  }, __rows: rows, __congregationRows: congregationRows, __calls:calls };
}
function fakeCongregation({ role = 'leader', congregationId = 'cong-1', name = 'Riverside' } = {}) {
  const MINISTRY = new Set(['facilitator', 'leader', 'pastor', 'admin']);
  return {
    async load() { return [{ congregationId, congregation: { name } }]; },
    can(id, capability) { if (id !== congregationId) return false; if (capability === 'read') return true; if (capability === 'ministry') return MINISTRY.has(role); return false; },
    assert(id, capability) { if (!this.can(id, capability)) { const e = new Error('Your congregation role does not allow this action.'); e.code = 'BQ_CONGREGATION_PERMISSION_DENIED'; throw e; } return true; }
  };
}

const guestStorage=memoryPrivateStorage();
const guestSession={getState:()=>({authenticated:false,user:null})};
const guestApi=fakeApi();
const guestAssignments={snapshot:()=>({assignments:[]})};
let calendar=createCalendarService({session:guestSession,privateStorage:guestStorage,api:guestApi,assignments:guestAssignments,clock:()=>new Date('2026-09-11T00:00:00.000Z')});
let state=await calendar.load();
assert.equal(state.owner,'guest');
assert.equal(state.accountUserId,'');
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
assert.equal(state.accountUserId,'edge-user-1');
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

// --- service: congregation-shared events, leader can share and only the creator can mutate ---
const leaderSession = { getState: () => ({ authenticated: true, user: { id: 'leader-1' } }) };
const leaderApi = fakeApi();
const leaderCongregation = fakeCongregation({ role: 'leader' });
let leaderCalendar = createCalendarService({ session: leaderSession, privateStorage: memoryPrivateStorage(), api: leaderApi, assignments: { snapshot: () => ({ assignments: [] }) }, congregation: leaderCongregation, clock: () => new Date('2026-09-11T00:00:00.000Z') });
let leaderState = await leaderCalendar.load();
assert.equal(leaderState.canShareWithCongregation, true, 'A leader-role member must be allowed to share events.');
leaderState = await leaderCalendar.addEvent({ title: 'Congregation prayer night', eventDate: '2026-09-12', shareWithCongregation: true, recurrenceWeeks: 1 });
assert.equal(leaderApi.__congregationRows.length, 1, 'Sharing must call createCongregation exactly once.');
assert.equal(leaderApi.__rows.length, 0, 'A shared event must never be written to the personal events table.');
let shared = leaderState.agenda.flatMap(day => day.events).filter(e => e.source === 'congregation');
assert.equal(shared.length, 2, 'A shared event with recurrenceWeeks:1 must appear twice in the agenda (original + 1 occurrence).');
const sharedBase = shared.find(e => !String(e.id).includes(':occurrence-'));
assert.equal(sharedBase.ownerId, 'leader-1', 'The shared event must expose its creator identity to the presentation layer.');
leaderState = await leaderCalendar.updateCongregationEvent(sharedBase.id, { title: 'Updated prayer night', eventDate: '2026-09-13', recurrenceWeeks: 2 });
assert.equal(leaderApi.__calls.updates, 1, 'Owner edit must cross the Calendar API boundary exactly once.');
assert.equal(leaderApi.__congregationRows[0].title, 'Updated prayer night');
assert.equal(leaderApi.__congregationRows[0].event_date, '2026-09-13');
assert.equal(leaderApi.__congregationRows[0].recurrence_weeks, 2);
shared = leaderState.agenda.flatMap(day => day.events).filter(e => e.source === 'congregation');
assert.equal(shared.length, 3, 'Editing recurrenceWeeks must refresh the shared agenda from server-authoritative rows.');
leaderState = await leaderCalendar.removeCongregationEvent(leaderApi.__congregationRows[0].id);
assert.equal(leaderApi.__calls.removals, 1, 'Owner delete must cross the Calendar API boundary exactly once.');
assert.equal(leaderApi.__congregationRows.length, 0, 'Owner delete must remove the shared row.');
assert.equal(leaderState.agenda.flatMap(day => day.events).filter(e => e.source === 'congregation').length, 0, 'Deleted shared events must disappear after server-authoritative reload.');

// --- service: an ordinary member cannot share, fails closed via Congregation Membership's own assert ---
const memberSession = { getState: () => ({ authenticated: true, user: { id: 'member-1' } }) };
const memberApi = fakeApi();
const memberCongregation = fakeCongregation({ role: 'member' });
let memberCalendar = createCalendarService({ session: memberSession, privateStorage: memoryPrivateStorage(), api: memberApi, assignments: { snapshot: () => ({ assignments: [] }) }, congregation: memberCongregation, clock: () => new Date('2026-09-11T00:00:00.000Z') });
let memberState = await memberCalendar.load();
assert.equal(memberState.canShareWithCongregation, false, 'An ordinary member must not be allowed to share events.');
await assert.rejects(
  () => memberCalendar.addEvent({ title: 'Should be rejected', eventDate: '2026-09-12', shareWithCongregation: true }),
  err => err.code === 'BQ_CONGREGATION_PERMISSION_DENIED',
  'Calendar must reuse Congregation Membership\'s own permission check, not invent its own authorization.'
);
assert.equal(memberApi.__congregationRows.length, 0, 'A rejected share must never reach the API boundary.');

// --- service: members read a leader's shared event but cannot edit/delete it ---
memberApi.__congregationRows.push({ id: 'cong-seed', congregation_id: 'cong-1', user_id: 'leader-1', title: 'Sunday service', notes: '', event_date: '2026-09-13', all_day: true, recurrence_weeks: 0 });
memberState = await memberCalendar.load();
const readOnlyShared = memberState.agenda.flatMap(day => day.events).find(e => e.source === 'congregation');
assert.ok(readOnlyShared, 'A member must see a congregation-shared event created by a leader.');
assert.equal(readOnlyShared.title, 'Sunday service');
assert.equal(readOnlyShared.ownerId, 'leader-1');
await assert.rejects(
  () => memberCalendar.updateCongregationEvent(readOnlyShared.id, { title: 'Unauthorized edit' }),
  err => err.code === 'BQ_CALENDAR_NOT_OWNER',
  'A non-owner must fail closed before attempting to edit a shared event.'
);
await assert.rejects(
  () => memberCalendar.removeCongregationEvent(readOnlyShared.id),
  err => err.code === 'BQ_CALENDAR_NOT_OWNER',
  'A non-owner must fail closed before attempting to delete a shared event.'
);
assert.deepEqual(memberApi.__calls, { updates: 0, removals: 0 }, 'Non-owner shared-event mutations must never reach the API boundary.');
assert.equal(memberApi.__congregationRows[0].title, 'Sunday service', 'Rejected owner mutations must not alter shared data.');

// --- service: sharing without a congregation membership fails closed, not silently ---
const noCongCalendar = createCalendarService({ session: leaderSession, privateStorage: memoryPrivateStorage(), api: fakeApi(), assignments: { snapshot: () => ({ assignments: [] }) }, clock: () => new Date('2026-09-11T00:00:00.000Z') });
await noCongCalendar.load();
await assert.rejects(
  () => noCongCalendar.addEvent({ title: 'x', eventDate: '2026-09-12', shareWithCongregation: true }),
  err => err.code === 'BQ_CALENDAR_NO_CONGREGATION',
  'Sharing without any Congregation Membership owner or membership must fail closed with a clear code, not throw a generic error.'
);

console.log('BibleQuest v3 Calendar edge regression passed.');
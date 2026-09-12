import assert from 'node:assert/strict';
import { homeAssignmentItems } from '../src/features/home/index.js';

const NOW = Date.parse('2026-09-12T00:00:00Z');
const row = (id,{title=id,type='reading',dueAt=null,dueState='open',progressStatus='assigned',submission='',leaderFeedback=''}={}) => ({
  id,title,type,dueAt,dueState,
  progress:{status:progressStatus,submission,leaderFeedback}
});

const state={
  status:'ready',
  role:'member',
  assignments:[
    row('pending',{title:'Later task'}),
    row('started',{title:'Started task',dueAt:'2026-09-15T00:00:00Z',progressStatus:'started'}),
    row('dueSoon',{title:'Due soon task',dueAt:'2026-09-13T00:00:00Z'}),
    row('overdue',{title:'Overdue task',dueAt:'2026-09-11T00:00:00Z',dueState:'overdue'}),
    row('completed',{title:'Completed secret',progressStatus:'completed',submission:'PRIVATE COMPLETED RESPONSE',leaderFeedback:'PRIVATE FEEDBACK'}),
    row('scheduled',{title:'Future scheduled task',dueAt:'2026-09-14T00:00:00Z',dueState:'scheduled'}),
    row('',{title:'Missing id'})
  ]
};

const all=homeAssignmentItems(state,{now:NOW,limit:10});
assert.deepEqual(all.map(item=>item.id),['overdue','dueSoon','started','pending'],'Home assignments must sort by urgency: overdue, due soon, in progress, pending.');
assert.deepEqual(all.map(item=>item.status.key),['overdue','due-soon','in-progress','pending'],'Home assignments must expose explicit text-backed status classes.');
assert.equal(all.find(item=>item.id==='started')?.progressLabel,'Started','Started task must remain visibly identified as started.');
assert.equal(all.find(item=>item.id==='pending')?.progressLabel,'Assigned','Pending task must remain visibly identified as assigned.');
assert.equal(all.some(item=>item.id==='completed'),false,'Completed assignments must disappear from Home active tasks.');
assert.equal(all.some(item=>item.id==='scheduled'),false,'Assignments that have not opened yet must stay off Home.');
assert.equal(JSON.stringify(all).includes('PRIVATE COMPLETED RESPONSE'),false,'Home assignment selector must not project private response text.');
assert.equal(JSON.stringify(all).includes('PRIVATE FEEDBACK'),false,'Home assignment selector must not project leader feedback.');

for(const item of all){
  assert.deepEqual(Object.keys(item).sort(),['dueAt','dueText','id','progressLabel','status','title','typeLabel'].sort(),`Home assignment projection leaked an unexpected field for ${item.id}.`);
  assert.deepEqual(Object.keys(item.status).sort(),['key','label','priority'].sort(),`Home assignment status leaked an unexpected field for ${item.id}.`);
}

assert.deepEqual(homeAssignmentItems(state,{now:NOW,limit:2}).map(item=>item.id),['overdue','dueSoon'],'Home summary limit must retain the highest-priority tasks.');
assert.equal(homeAssignmentItems({status:'signed-out',assignments:state.assignments},{now:NOW}).length,0,'Signed-out state must not expose assignment metadata on Home.');
assert.equal(homeAssignmentItems({status:'local-preview',assignments:state.assignments},{now:NOW}).length,0,'Local preview must not expose cloud assignment metadata on Home.');
assert.equal(homeAssignmentItems({status:'ready',assignments:[]},{now:NOW}).length,0,'Empty assignment state must remain empty.');

const boundary=homeAssignmentItems({status:'ready',assignments:[
  row('at48',{dueAt:'2026-09-14T00:00:00Z'}),
  row('after48',{dueAt:'2026-09-14T00:00:01Z'}),
  row('startedSoon',{dueAt:'2026-09-12T12:00:00Z',progressStatus:'started'})
]},{now:NOW,limit:10});
assert.equal(boundary.find(item=>item.id==='at48')?.status.key,'due-soon','Exactly 48 hours must count as due soon.');
assert.equal(boundary.find(item=>item.id==='after48')?.status.key,'pending','More than 48 hours away must not count as due soon.');
assert.equal(boundary.find(item=>item.id==='startedSoon')?.status.key,'due-soon','Urgent due-soon state must take precedence over generic in-progress styling.');

console.log('BibleQuest v4 Home Assignments state/priority edge contract passed.');

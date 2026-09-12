import assert from 'node:assert/strict';
import { homeAssignmentItems, homeAssignmentPanelHtml } from '../src/features/home/index.js';

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

const stateHtml=(value,key)=>{
  const html=homeAssignmentPanelHtml(value);
  assert.ok(html.includes(`data-home-assignment-state="${key}"`),`Home assignment panel must expose explicit ${key} state.`);
  assert.ok(html.includes('data-home-assignments-all'),`${key} state must retain a direct action into the existing Assignments route.`);
  return html;
};

stateHtml({status:'loading'},'loading');
const signedOutHtml=stateHtml({status:'signed-out',assignments:[row('hidden',{title:'SHOULD NOT LEAK'})]},'signed-out');
assert.equal(signedOutHtml.includes('SHOULD NOT LEAK'),false,'Signed-out Home state must not expose assignment metadata.');
const offlineHtml=stateHtml({status:'local-preview',assignments:[row('hidden',{title:'OFFLINE SECRET'})]},'offline');
assert.equal(offlineHtml.includes('OFFLINE SECRET'),false,'Offline/local-preview Home state must not expose cloud assignment metadata.');
stateHtml({status:'no-congregation',authenticated:true,assignments:[]},'no-congregation');
const errorHtml=stateHtml({status:'error',error:'PRIVATE SERVER DETAIL'},'error');
assert.ok(errorHtml.includes('data-home-assignments-retry'),'Error state must offer retry through the existing Assignments owner.');
assert.equal(errorHtml.includes('PRIVATE SERVER DETAIL'),false,'Home must not echo raw assignment service/API errors.');
stateHtml({status:'ready',role:'member',assignments:[]},'empty');
const completedHtml=stateHtml({status:'ready',role:'member',assignments:[row('done',{title:'Finished task',progressStatus:'completed',submission:'PRIVATE COMPLETED RESPONSE',leaderFeedback:'PRIVATE FEEDBACK'})]},'completed');
assert.equal(completedHtml.includes('PRIVATE COMPLETED RESPONSE'),false,'Completed Home state must never expose private response text.');
assert.equal(completedHtml.includes('PRIVATE FEEDBACK'),false,'Completed Home state must never expose leader feedback.');

const oneHtml=stateHtml({status:'ready',role:'member',assignments:[row('one',{title:'One open task'})]},'active');
assert.ok(oneHtml.includes('ASSIGNMENTS · 1'),'One-open-assignment state must display an explicit count.');
assert.ok(oneHtml.includes('One open task'),'One-open-assignment state must expose safe task metadata.');

const liveDueSoon=new Date(Date.now()+60*60*1000).toISOString();
const activeHtml=stateHtml({status:'ready',role:'member',assignments:[
  row('overdue-live',{title:'Overdue live',dueAt:new Date(Date.now()-60*60*1000).toISOString(),dueState:'overdue'}),
  row('due-soon-live',{title:'Due soon live',dueAt:liveDueSoon}),
  row('started-live',{title:'Started live',progressStatus:'started'}),
  row('pending-live',{title:'Pending live'})
]},'active');
assert.ok(activeHtml.includes('data-home-assignment-status="overdue"'),'Active Home panel must visibly distinguish overdue work.');
assert.ok(activeHtml.includes('data-home-assignment-status="due-soon"'),'Active Home panel must visibly distinguish due-soon work.');
assert.ok(activeHtml.includes('data-home-assignment-status="in-progress"'),'Active Home panel must visibly distinguish started/in-progress work.');
assert.ok(activeHtml.includes('ASSIGNMENTS · 4'),'Multiple-open-assignment state must preserve total active count even when the Home list is capped.');

const escaped=homeAssignmentPanelHtml({status:'ready',role:'member',assignments:[row('escape',{title:'<script>"unsafe"</script>'})]});
assert.equal(escaped.includes('<script>'),false,'Home assignment metadata must be HTML-escaped.');
assert.ok(escaped.includes('&lt;script&gt;'),'Home assignment title escaping must preserve readable safe text.');

console.log('BibleQuest v4 Home Assignments full state/priority/privacy contract passed.');

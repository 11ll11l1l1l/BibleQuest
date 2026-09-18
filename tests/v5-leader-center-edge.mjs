// BibleQuest V5 Phase 1: Leader Center edge coverage. Verifies this is pure
// composition - it must never invent access beyond what assignments.js and
// presence.js already independently authorize.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createLeaderCenterService } from '../src/app/leader-center.js';

function fakeAssignments(state, extras={}) {
  return {
    async load() { return state; },
    snapshot() { return state; },
    ...extras
  };
}
function fakePresence(count) {
  const calls = [];
  return { calls, async activeCount(congregationId, windowMinutes) { calls.push({ congregationId, windowMinutes }); return count === null ? null : { count, windowMinutes }; } };
}

assert.throws(() => createLeaderCenterService({}), /requires the existing Assignments and Presence owners/);

// Signed-out caller: no access, no secondary reads.
{
  let targetCalls=0;
  const assignments = fakeAssignments({ status: 'idle' },{async loadPublishTargets(){targetCalls++;}});
  const presence = fakePresence(5);
  const state = await createLeaderCenterService({ assignments, presence }).load();
  assert.equal(state.status, 'signed-out');
  assert.equal(state.authorized, false);
  assert.equal(presence.calls.length, 0);
  assert.equal(targetCalls,0);
}

// Ordinary member: denied before presence or ministry directory access.
{
  let targetCalls=0;
  const assignments = fakeAssignments({ status: 'ready', role: 'member', congregationId: 'c1', congregationName: 'Test', assignments: [] },{async loadPublishTargets(){targetCalls++;}});
  const presence = fakePresence(5);
  const state = await createLeaderCenterService({ assignments, presence }).load();
  assert.equal(state.status, 'unauthorized');
  assert.equal(state.authorized, false);
  assert.equal(presence.calls.length, 0);
  assert.equal(targetCalls,0);
}

// Each ministry role remains allowed even when the optional directory helper is unavailable.
for (const role of ['facilitator', 'leader', 'pastor', 'admin']) {
  const assignments = fakeAssignments({ status: 'ready', role, congregationId: 'c1', congregationName: 'Test Congregation', assignments: [] });
  const presence = fakePresence(3);
  const service = createLeaderCenterService({ assignments, presence });
  const state = await service.load();
  assert.equal(state.status, 'ready', `Role '${role}' must be authorized for the Leader Center.`);
  assert.equal(state.congregationName, 'Test Congregation');
  assert.equal(state.activeInLast30Min, 3);
  assert.equal(state.directoryStatus,'unavailable');
  assert.equal(state.memberCount,null,'Unavailable directory must never be presented as zero members.');
  assert.equal(presence.calls[0].congregationId, 'c1');
}
assert.equal(createLeaderCenterService(({ assignments: fakeAssignments({}), presence: fakePresence(0) })).isMinistryRole('member'), false);
assert.equal(createLeaderCenterService(({ assignments: fakeAssignments({}), presence: fakePresence(0) })).isMinistryRole('leader'), true);

// Assignment lifecycle uses the authoritative targeted-recipient aggregate.
{
  const now = Date.now();
  const rows = [
    { id: 'a1', scheduleAt: null, title: 'Open one' },
    { id: 'a2', scheduleAt: new Date(now + 86400000).toISOString(), title: 'Scheduled future' },
    { id: 'a3', scheduleAt: new Date(now - 86400000).toISOString(), title: 'Past schedule, now open' }
  ];
  const assignments = fakeAssignments({ status: 'ready', role: 'leader', congregationId: 'c1', congregationName: 'Test', assignments: rows },{
    async loadLifecycle(){return[
      {assignmentId:'a1',status:'completed',recipientCount:2,completedCount:2},
      {assignmentId:'a2',status:'scheduled',recipientCount:3,completedCount:0},
      {assignmentId:'a3',status:'published',recipientCount:3,completedCount:2}
    ]}
  });
  const state = await createLeaderCenterService({ assignments, presence: fakePresence(0) }).load();
  assert.equal(state.assignments.total, 3);
  assert.equal(state.assignments.scheduled.length, 1);
  assert.equal(state.assignments.scheduled[0].id, 'a2');
  assert.equal(state.assignments.published.length, 1);
  assert.equal(state.assignments.published[0].id, 'a3');
  assert.equal(state.assignments.completed.length, 1);
  assert.equal(state.assignments.completed[0].id, 'a1');
  assert.equal(state.assignments.completed[0].lifecycle.completedCount,2);
  assert.equal(state.assignments.denominator,'current-active-target-recipients');
  assert.equal(state.assignments.unclassified.length,0);
}

// Lifecycle failure never guesses completion from the leader's own progress.
{
  const rows=[{id:'a1',title:'Unknown aggregate',progress:{status:'completed'}}];
  const assignments=fakeAssignments({status:'ready',role:'leader',congregationId:'c1',congregationName:'Church',assignments:rows},{async loadLifecycle(){throw new Error('offline')}});
  const state=await createLeaderCenterService({assignments,presence:fakePresence(0)}).load();
  assert.equal(state.assignments.lifecycleStatus,'unavailable');
  assert.equal(state.assignments.completed.length,0);
  assert.equal(state.assignments.published.length,0);
  assert.equal(state.assignments.unclassified.length,1);
}

// Existing ministry-authorized publish targets are projected into a privacy-safe directory.
{
  const base={ status:'ready', role:'leader', congregationId:'c1', congregationName:'Church', assignments:[] };
  const targets={members:[{id:'m1',label:'Ana',role:'member',privateNote:'NEVER'},{id:'m2',label:'Ben',role:'leader',transformAnswer:'NEVER'}],groups:[{id:'g1',label:'Young Adults',secret:'NEVER'}],teams:[{id:'t1',label:'Worship',type:'ministry',private:'NEVER'}]};
  const assignments=fakeAssignments(base,{async loadPublishTargets(){return {...base,publishTargets:targets}}});
  const state=await createLeaderCenterService({assignments,presence:fakePresence(2)}).load();
  assert.equal(state.directoryStatus,'ready');
  assert.equal(state.memberCount,2);
  assert.deepEqual(state.people,[{id:'m1',label:'Ana',role:'member'},{id:'m2',label:'Ben',role:'leader'}]);
  assert.deepEqual(state.groups,[{id:'g1',label:'Young Adults'}]);
  assert.deepEqual(state.teams,[{id:'t1',label:'Worship',type:'ministry'}]);
  const serialized=JSON.stringify({people:state.people,groups:state.groups,teams:state.teams});
  assert.doesNotMatch(serialized,/privateNote|transformAnswer|secret|private|NEVER/);
}

// Directory failure is secondary and truthful: Overview survives and count is unknown, never zero.
{
  const base={ status:'ready', role:'leader', congregationId:'c1', congregationName:'Church', assignments:[] };
  const assignments=fakeAssignments(base,{async loadPublishTargets(){throw new Error('targets unavailable')}});
  const state=await createLeaderCenterService({assignments,presence:fakePresence(1)}).load();
  assert.equal(state.status,'ready');
  assert.equal(state.directoryStatus,'unavailable');
  assert.equal(state.memberCount,null);
  assert.deepEqual(state.people,[]);
}

// Review handoff reuses the existing Assignments owner and opens the real review state.
{
  const calls=[];
  const assignments=fakeAssignments({status:'ready',role:'leader',congregationId:'c1',congregationName:'Church',assignments:[]},{
    open(id){calls.push(['open',id]);},
    async loadReview(id){calls.push(['loadReview',id]);return {activeId:id,activeReview:{status:'ready'}};}
  });
  const service=createLeaderCenterService({assignments,presence:fakePresence(0)});
  const result=await service.openReview('a9');
  assert.deepEqual(calls,[['open','a9'],['loadReview','a9']]);
  assert.equal(result.activeReview.status,'ready');
  await assert.rejects(()=>service.openReview(''),/Choose an assignment/);
}

// Presence remains secondary.
{
  const assignments = fakeAssignments({ status: 'ready', role: 'leader', congregationId: 'c1', congregationName: 'Test', assignments: [] });
  const presence = { async activeCount() { throw new Error('presence backend unavailable'); } };
  const state = await createLeaderCenterService({ assignments, presence }).load();
  assert.equal(state.status, 'ready');
  assert.equal(state.activeInLast30Min, null);
}

// Firewall: Leader Center itself must not become a private-data or direct-backend owner.
{
  const [serviceSource,pageSource]=await Promise.all([
    readFile(new URL('../src/app/leader-center.js',import.meta.url),'utf8'),
    readFile(new URL('../src/features/leader-center/index.js',import.meta.url),'utf8')
  ]);
  const runtime=serviceSource+'\n'+pageSource;
  assert.doesNotMatch(runtime,/createClient|supabase\.|\.from\(|localStorage|sessionStorage|fetch\(/i);
  assert.doesNotMatch(serviceSource,/private-notes|couples-cloud|couples-family|personality-profile|psychometrics/i);
  assert.match(serviceSource,/loadPublishTargets/);
  assert.match(serviceSource,/loadLifecycle/);
  assert.match(serviceSource,/assignments\.loadReview/);
}

console.log('BibleQuest v5 Leader Center edge regression passed.');

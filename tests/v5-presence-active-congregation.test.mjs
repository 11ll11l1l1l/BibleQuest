import assert from 'node:assert/strict';
import {createPresenceService} from '../src/app/presence.js';

const calls={touch:[],leave:[],list:[],count:[]};
const now=Date.parse('2026-09-15T00:00:00Z');
let activeId='cong-a';
const memberships=[
  {congregationId:'cong-a',userId:'user-1',role:'leader'},
  {congregationId:'cong-b',userId:'user-1',role:'leader'}
];
const sessionState={authenticated:true,remoteAvailable:true,user:{id:'user-1'}};
const session={
  getState:()=>sessionState,
  beforeSignOut:()=>()=>{}
};
const congregation={
  list:()=>memberships,
  load:async()=>memberships,
  getActive:()=>memberships.find(row=>row.congregationId===activeId)||null,
  can:(id,capability)=>capability==='read'&&memberships.some(row=>row.congregationId===id&&row.userId==='user-1')
};
const store={
  state:{session:sessionState},
  setState(updater){this.state=typeof updater==='function'?updater(this.state):updater},
  subscribe(){return ()=>{}}
};
const api={
  async touch(id,userId,surface){calls.touch.push([id,userId,surface])},
  async leave(id,userId){calls.leave.push([id,userId])},
  async list(id){calls.list.push(id);return [{congregation_id:id,user_id:'user-2',last_seen_at:new Date(now).toISOString(),surface:'BibleQuest'}]},
  async activeCount(id,windowMinutes){calls.count.push([id,windowMinutes]);return 4}
};

const presence=createPresenceService({
  api,session,congregation,store,clock:()=>now,
  heartbeatMs:60000,staleMs:150000,
  setIntervalFn:()=>1,clearIntervalFn:()=>{}
});

await presence.start();
assert.deepEqual(calls.touch,[['cong-a','user-1','BibleQuest']], 'start heartbeats only the active congregation');
assert.deepEqual(presence.getState().congregationIds,['cong-a']);

const inactiveRows=await presence.load('cong-b');
assert.deepEqual(inactiveRows,[], 'inactive congregation rows are not readable even for another membership');
assert.deepEqual(calls.list,[], 'inactive congregation never reaches presence row API');
assert.equal(await presence.activeCount('cong-b'),null, 'inactive congregation aggregate is not queried');
assert.deepEqual(calls.count,[], 'inactive aggregate never reaches API');

const rows=await presence.load('cong-a');
assert.equal(rows.length,1);
assert.deepEqual(calls.list,['cong-a']);
const aggregate=await presence.activeCount('cong-a',30);
assert.deepEqual(aggregate,{count:4,windowMinutes:30});
assert.deepEqual(calls.count,[['cong-a',30]]);

activeId='cong-b';
await presence.heartbeat();
assert.deepEqual(calls.leave,[['cong-a','user-1']], 'switch removes prior-congregation presence before publishing new active context');
assert.deepEqual(calls.touch,[['cong-a','user-1','BibleQuest'],['cong-b','user-1','BibleQuest']]);
assert.deepEqual(presence.getState().congregationIds,['cong-b']);
assert.deepEqual(presence.snapshot('cong-a'),[], 'cached rows from prior congregation are hidden after switch');
assert.equal(await presence.activeCount('cong-a'),null);
assert.deepEqual(calls.count,[['cong-a',30]]);

await presence.leave();
assert.deepEqual(calls.leave,[['cong-a','user-1'],['cong-b','user-1']], 'sign-out cleanup targets only the active presence context');
console.log('V5 Presence active-congregation regression: PASS');

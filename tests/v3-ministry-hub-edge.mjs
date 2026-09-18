import assert from 'node:assert/strict';
import {createCongregationMembershipService} from '../src/app/congregation-membership.js';
import {createMinistryHubService} from '../src/app/ministry-hub.js';

let sessionState={authenticated:false,user:null},rows=[],listCalls=0;
const session={getState:()=>sessionState};
const api={congregation:{listMemberships:async()=>{listCalls++;return rows},join:async()=>({})}};
const congregation=createCongregationMembershipService({api,session});
const hub=createMinistryHubService({congregation});

let state=await hub.load();
assert.equal(state.status,'signed-out');
assert.equal(state.memberTools.length,0);
assert.equal(state.ministryTools.length,0);
assert.equal(listCalls,0,'Signed-out Ministry Hub must not query congregation membership.');

sessionState={authenticated:true,user:{id:'u1'}};
rows=[
  {congregation_id:'c1',user_id:'u1',role:'member',congregation:{id:'c1',name:'Member Church'}},
  {congregation_id:'c2',user_id:'u1',role:'leader',congregation:{id:'c2',name:'Leader Church'}},
  {congregation_id:'c3',user_id:'u1',role:'bishop',congregation:{id:'c3',name:'Unknown Role Church'}}
];
state=await hub.load();
assert.equal(state.status,'ready');
assert.equal(state.congregations.length,3);
assert.equal(state.hasReadableMembership,true);
assert.equal(state.canMinistry,true);
assert.deepEqual(state.memberTools.map(tool=>tool.id),['assignments','calendar','journey-groups','live-room']);
assert.deepEqual(state.ministryTools.map(tool=>tool.id),['assignment-publishing','leader-dashboard']);
assert.equal(state.memberTools.find(tool=>tool.id==='calendar')?.route,'calendar','Calendar must delegate to the verified Calendar route.');
assert.equal(state.memberTools.find(tool=>tool.id==='calendar')?.available,true,'Calendar must be available to valid congregation members.');
assert.equal(state.congregations.find(row=>row.congregationId==='c1').canMinistry,false);
assert.equal(state.congregations.find(row=>row.congregationId==='c2').canMinistry,true);
assert.equal(state.congregations.find(row=>row.congregationId==='c3').canRead,false,'Unsupported role must fail closed for readable congregation tools.');
assert.equal(state.congregations.find(row=>row.congregationId==='c3').canMinistry,false,'Unsupported role must fail closed for ministry tools.');
assert.equal(state.memberTools.find(tool=>tool.id==='live-room').available,false,'Live Room must remain deferred.');
assert.equal(state.ministryTools.find(tool=>tool.id==='leader-dashboard').available,true,'Leader Center (V5 Phase 1) is no longer deferred.');
assert.equal(state.ministryTools.find(tool=>tool.id==='leader-dashboard').route,'leader-center','Leader Center tool must route to the real leader-center page.');

rows=[{congregation_id:'c1',user_id:'u1',role:'member',congregation:{id:'c1',name:'Member Church'}}];
state=await hub.load();
assert.equal(state.hasReadableMembership,true);
assert.equal(state.canMinistry,false);
assert.equal(state.ministryTools.length,0,'Ordinary member must receive no ministry-only tools.');
assert.equal(state.memberTools.filter(tool=>tool.available).length,3);
assert.equal(state.memberTools.some(tool=>tool.id==='calendar'&&tool.route==='calendar'),true,'Ordinary members must retain Calendar navigation.');

rows=[{congregation_id:'c9',user_id:'u1',role:'unknown',congregation:{id:'c9',name:'Unsupported Church'}}];
state=await hub.load();
assert.equal(state.hasReadableMembership,false);
assert.equal(state.canMinistry,false);
assert.equal(state.memberTools.length,0);
assert.equal(state.ministryTools.length,0);

console.log('BibleQuest v3 Ministry Hub role-boundary regression passed.');

import assert from 'node:assert/strict';
import {createLiveRoomsService} from '../src/app/live-rooms.js';

let userId='u1',remoteAvailable=true,activeCongregationId='c1';
const session={getState:()=>({authenticated:Boolean(userId),remoteAvailable,user:userId?{id:userId}:null})};
const membershipRows=[
  {congregationId:'c1',congregation:{name:'Test Church'},role:'pastor',roleLabel:'Pastor'},
  {congregationId:'c2',congregation:{name:'Second Church'},role:'leader',roleLabel:'Leader'}
];
let loaded=false;
const congregation={
  async load(){loaded=true;return membershipRows},
  getActive(){return loaded?membershipRows.find(row=>row.congregationId===activeCongregationId)||null:null},
  get(id){return loaded?membershipRows.find(row=>row.congregationId===String(id))||null:null},
  can(id,cap){return cap==='ministry'&&membershipRows.some(row=>row.congregationId===String(id))},
  assert(id,cap){assert.equal(id,activeCongregationId);assert.equal(cap,'ministry')}
};

let current={id:'r1',congregation_id:'c1',created_by:'u1',session_type:'live-room',title:'Friday',room_code:'ABC234',status:'lobby',state:{round:0,activity:'lobby'},updated_at:'t1'};
let participantRows=[{session_id:'r1',user_id:'u1',created_at:'t0'}],stops=0,joins=0,listener=null,ended=0;
const calls=[];
const api={
  async create(row){calls.push(['create',row.congregation_id]);assert.equal(row.congregation_id,activeCongregationId);assert.equal(row.session_type,'live-room');current={...current,...row};return current},
  async findByCode(code,tenantId){calls.push(['find',code,tenantId]);assert.equal(tenantId,activeCongregationId);return current.congregation_id===tenantId&&current.room_code===code&&current.status!=='ended'?current:null},
  async loadRoom(id,tenantId){calls.push(['loadRoom',id,tenantId]);assert.equal(tenantId,activeCongregationId);return current.id===id&&current.congregation_id===tenantId?current:null},
  async joinParticipant(id,uid,tenantId){calls.push(['joinParticipant',id,uid,tenantId]);assert.equal(tenantId,activeCongregationId);joins++;if(!participantRows.some(row=>row.session_id===id&&row.user_id===uid))participantRows.push({session_id:id,user_id:uid,created_at:'now'});return{}},
  async participants(id,tenantId){calls.push(['participants',id,tenantId]);assert.equal(tenantId,activeCongregationId);return{participants:participantRows.filter(row=>row.session_id===id),directory:[{user_id:'u1',display_name:'Host'},{user_id:'u2',display_name:'Guest'}]}},
  subscribe(id,tenantId,fn){calls.push(['subscribe',id,tenantId]);assert.equal(tenantId,activeCongregationId);assert.equal(id,current.id);listener=fn;return()=>{stops++}},
  async endRoom(id,uid,tenantId){calls.push(['end',id,uid,tenantId]);assert.equal(tenantId,activeCongregationId);assert.equal(uid,'u1');ended++;current={...current,status:'ended'};return current}
};

const rooms=createLiveRoomsService({api,session,congregation,codeFactory:()=> 'ABC234'});
let state=await rooms.load();
assert.equal(state.loadedCongregationId,'c1');
assert.equal(state.memberships.length,1);
assert.equal(state.memberships[0].congregationId,'c1','Live Rooms must expose only the active congregation membership.');

state=await rooms.create({congregationId:'c1',title:'Friday'});
assert.equal(state.room.roomCode,'ABC234');
assert.equal(state.isHost,true);
assert.equal(state.connected,true);
assert.equal(state.participants.length,1);
assert.equal(joins,1);
assert.ok(calls.some(call=>call.join(':')==='joinParticipant:r1:u1:c1'),'Create activation must carry the active tenant into participant mutation.');

state=rooms.disconnect();assert.equal(state.room.id,'r1');assert.equal(state.connected,false);assert.equal(stops,1);
state=await rooms.reconnect();assert.equal(state.room.id,'r1');assert.equal(state.connected,true);assert.equal(joins,2,'Reconnect must idempotently rejoin the participant row.');
participantRows.push({session_id:'r1',user_id:'u2',created_at:'t2'});listener({type:'participants'});await new Promise(resolve=>setTimeout(resolve,0));assert.equal(rooms.snapshot().participants.length,2);
state=rooms.leave();assert.equal(state.room,null);assert.equal(state.participants.length,0);assert.equal(state.connected,false);

userId='u2';loaded=false;current={...current,status:'lobby',created_by:'u1'};state=await rooms.join('abc-234');
assert.equal(state.room.id,'r1');assert.equal(state.isHost,false);assert.equal(state.participants.some(row=>row.userId==='u2'),true);
assert.ok(calls.some(call=>call.join(':')==='find:ABC234:c1'),'Join lookup must include the active congregation.');
rooms.disconnect();current={...current,status:'active',updated_at:'t3'};state=await rooms.reconnect();assert.equal(state.room.status,'active','Reconnect must replace retained state with server state.');

activeCongregationId='c2';
assert.equal(rooms.snapshot().room,null,'A tenant switch must immediately hide the prior room.');
assert.equal(rooms.snapshot().memberships.length,0,'A tenant switch must immediately hide prior membership state.');
await assert.rejects(()=>rooms.reconnect(),error=>error.code==='BQ_LIVE_ROOMS_CONTEXT_STALE');
await assert.rejects(()=>rooms.create({congregationId:'c1',title:'Wrong tenant'}),error=>error.code==='BQ_LIVE_ROOMS_CONTEXT_STALE');
state=await rooms.load();
assert.equal(state.loadedCongregationId,'c2');
assert.equal(state.memberships.length,1);
assert.equal(state.memberships[0].congregationId,'c2');

current={id:'r2',congregation_id:'c2',created_by:'u2',session_type:'live-room',title:'Second',room_code:'CDE456',status:'lobby',state:{round:0,activity:'lobby'},updated_at:'t4'};
participantRows=[{session_id:'r2',user_id:'u2',created_at:'t4'}];
state=await rooms.join('cde-456');
assert.equal(state.room.id,'r2');
assert.equal(state.room.congregationId,'c2');
assert.ok(calls.some(call=>call.join(':')==='find:CDE456:c2'),'Tenant-switched join must query only the new active congregation.');

rooms.leave();userId='u1';activeCongregationId='c1';loaded=false;current={id:'r1',congregation_id:'c1',created_by:'u1',session_type:'live-room',title:'Friday',room_code:'ABC234',status:'lobby',state:{round:0,activity:'lobby'},updated_at:'t5'};participantRows=[{session_id:'r1',user_id:'u1',created_at:'t5'}];
await rooms.join('ABC234');await rooms.end();assert.equal(ended,1);assert.equal(rooms.snapshot().room,null,'Ending a room must clear local room state.');
assert.ok(calls.some(call=>call.join(':')==='end:r1:u1:c1'),'Ending a room must carry active tenant scope.');

current={...current,status:'ended'};await assert.rejects(()=>rooms.join('ABC234'),/not found|ended/i);assert.equal(rooms.snapshot().room,null,'Ended room rejection must not leave stale state.');

rooms.clear();activeCongregationId='';loaded=false;state=await rooms.load();
assert.equal(state.loadedCongregationId,'','Signed-in Live Rooms may load an empty state before a congregation is selected.');
assert.deepEqual(state.memberships,[],'No active congregation must expose no Live Room membership scope.');
const findsBeforeNoActive=calls.filter(call=>call[0]==='find').length;
await assert.rejects(()=>rooms.join('ABC234'),error=>error.code==='BQ_LIVE_ROOMS_CONGREGATION');
assert.equal(calls.filter(call=>call[0]==='find').length,findsBeforeNoActive,'Join without an active congregation must fail before room lookup.');

rooms.clear();remoteAvailable=false;await assert.rejects(()=>rooms.load(),error=>error.code==='BQ_LIVE_ROOMS_REMOTE_DISABLED');assert.equal(rooms.snapshot().room,null);
console.log('BibleQuest v3 Live Rooms active-tenant edge regression passed');

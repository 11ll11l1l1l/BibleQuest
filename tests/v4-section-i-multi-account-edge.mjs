import assert from 'node:assert/strict';
import {createAssignmentsService} from '../src/app/assignments.js';
import {createJourneyGroupsService} from '../src/app/journey-groups.js';
import {createTeamCenterService} from '../src/app/team-center.js';
import {createCouplesCloudService} from '../src/app/couples-cloud.js';
import {createLiveRoomsService} from '../src/app/live-rooms.js';

const now='2026-09-12T00:00:00.000Z';
const assignment={id:'a1',congregation_id:'c1',created_by:'leader',title:'Private reflection',instructions:'',assignment_type:'reflection',scripture_refs:[],target_scope:'all',target_id:null,due_at:null,points:5,active:true,created_at:now,updated_at:now};

// Assignments: switching accounts inside the same congregation must invalidate
// private leader review responses and publisher target directories.
{
  let userId='u1';
  const session={getState:()=>({authenticated:true,remoteAvailable:true,user:{id:userId}})};
  const memberships=()=>[{congregationId:'c1',userId,role:'leader',roleKnown:true,roleLabel:'Leader',congregation:{id:'c1',name:'Church One'}}];
  const congregation={load:async()=>memberships(),assert:()=>{},can:()=>true};
  const api={
    load:async()=>({assignments:[assignment],progress:[]}),start:async()=>({}),complete:async()=>({}),subscribe:async()=>()=>{},
    targets:async()=>({members:[{id:`target-${userId}`,label:`Member for ${userId}`,role:'member'}],teams:[],groups:[]}),
    loadResponsePresence:async()=>[{assignment_id:'a1',congregation_id:'c1',user_id:'member1',display_name:'Member One',completed_at:now}],
    loadPrivateResponses:async()=>[{assignment_id:'a1',user_id:'member1',status:'completed',submission:`secret-for-${userId}`,leader_feedback:'',completed_at:now,updated_at:now}]
  };
  const service=createAssignmentsService({api,session,congregation});
  await service.load();await service.loadPublishTargets();service.open('a1');await service.loadReview();
  assert.equal(service.snapshot().activeReview.responses[0].submission,'secret-for-u1');
  assert.equal(service.snapshot().publishTargets.members[0].id,'target-u1');
  userId='u2';
  await service.load({congregationId:'c1'});
  const next=service.snapshot();
  assert.equal(next.userId,'u2');
  assert.equal(next.publishTargets.members.length,0,'Assignments leaked the prior account publisher directory.');
  assert.equal(next.activeReview.responses.length,0,'Assignments leaked the prior account private review responses.');
}

// Journey Groups: a failed reload under a different account must not leave the
// previous account group list visible in the service snapshot.
{
  let userId='u1';
  const session={getState:()=>({authenticated:true,remoteAvailable:true,user:{id:userId}})};
  const congregation={load:async()=>[{congregationId:'c1',role:'leader',roleLabel:'Leader',congregation:{id:'c1',name:'Church One'}}],can:()=>true,assert:()=>{}};
  const api={
    list:async id=>id==='u1'?{groups:[{id:'g1',owner_id:'u1',congregation_id:'c1',name:'U1 Group',description:'',schedule_text:'',max_members:6,active:true}],members:[{group_id:'g1',user_id:'u1',role:'leader',joined_at:now}]}:{groups:[{id:'g2',owner_id:'u9',congregation_id:'c1',name:'Foreign',description:'',schedule_text:'',max_members:6,active:true}],members:[{group_id:'g2',user_id:'u9',role:'leader',joined_at:now}]},
    create:async()=>({}),join:async()=>({}),rotateCode:async()=>({}),leave:async()=>({})
  };
  const service=createJourneyGroupsService({api,session,congregation});
  await service.load();assert.equal(service.snapshot().groups[0].id,'g1');
  userId='u2';
  await assert.rejects(()=>service.load(),error=>error.code==='BQ_JOURNEY_GROUPS_PERMISSION');
  assert.equal(service.snapshot().groups.length,0,'Journey Groups retained prior-account groups after an account-switch reload failure.');
}

// Team Center: stale teams/directory must be cleared before a new-account load,
// even if the server returns out-of-scope data and normalization fails.
{
  let userId='u1';
  const session={getState:()=>({authenticated:true,remoteAvailable:true,user:{id:userId}})};
  const congregation={load:async()=>[{congregationId:userId==='u1'?'c1':'c2',role:'leader',roleLabel:'Leader',congregation:{id:userId==='u1'?'c1':'c2',name:'Church'}}],can:()=>true,assert:()=>{}};
  const api={
    list:async ids=>ids[0]==='c1'?{teams:[{id:'t1',congregation_id:'c1',created_by:'u1',team_type:'game_team',name:'U1 Team',active:true,created_at:now}],members:[{team_id:'t1',user_id:'u1',joined_at:now}],directory:[{congregation_id:'c1',user_id:'u1',display_name:'U1',role:'leader',active:true,joined_at:now}]}:{teams:[{id:'bad',congregation_id:'c9',created_by:'u9',team_type:'game_team',name:'Foreign',active:true,created_at:now}],members:[],directory:[]},
    create:async()=>({}),add:async()=>({}),remove:async()=>({}),rename:async()=>({}),archive:async()=>({})
  };
  const service=createTeamCenterService({api,session,congregation});
  await service.load();assert.equal(service.snapshot().teams[0].id,'t1');
  userId='u2';
  await assert.rejects(()=>service.load(),error=>error.code==='BQ_TEAM_CENTER_SCOPE');
  assert.equal(service.snapshot().teams.length,0,'Team Center retained prior-account teams after an account-switch reload failure.');
  assert.equal(service.snapshot().directory.length,0,'Team Center retained prior-account directory data after an account-switch reload failure.');
}

// Couples: a foreign-pair response after switching accounts must fail closed and
// must not expose the previous partner/shared-history state.
{
  let userId='u1';
  const session={getState:()=>({authenticated:true,remoteAvailable:true,user:{id:userId}})};
  const pairU1={id:'p1',user_a:'u1',user_b:'partner1',status:'active',created_at:now,updated_at:now};
  const api={
    status:async()=>userId==='u1'?{pair:pairU1}:{pair:{id:'foreign',user_a:'x',user_b:'y',status:'active',created_at:now,updated_at:now}},
    listShared:async()=>[{id:'s1',pair_id:'p1',author_id:'partner1',item_type:'commitment',body:'u1-private',created_at:now,updated_at:now}],
    create:async()=>({}),join:async()=>({}),leave:async()=>({}),addShared:async()=>({})
  };
  const service=createCouplesCloudService({api,session});
  await service.load();assert.equal(service.snapshot().shared[0].body,'u1-private');
  userId='u2';
  await assert.rejects(()=>service.load(),error=>error.code==='BQ_COUPLES_CLOUD_PERMISSION');
  const next=service.snapshot();
  assert.equal(next.pair,null,'Couples retained the previous account pair after account-switch rejection.');
  assert.equal(next.shared.length,0,'Couples retained the previous account shared history after account-switch rejection.');
}

// Live Rooms: switching accounts must discard the old participant/room context
// before membership reload. A new account must explicitly rejoin a room.
{
  let userId='u1',memberships=[{congregationId:'c1',congregation:{name:'Church One'},role:'leader'}],joinCalls=0;
  const session={getState:()=>({authenticated:true,remoteAvailable:true,user:{id:userId}})};
  const congregation={async load(){return memberships},get(id){return memberships.find(row=>row.congregationId===id)||null},can:()=>true,assert:()=>{}};
  const room={id:'r1',congregation_id:'c1',created_by:'u1',session_type:'live-room',title:'Private room',room_code:'ABC234',status:'lobby',state:{},updated_at:now};
  const api={create:async()=>room,findByCode:async()=>room,loadRoom:async()=>room,joinParticipant:async()=>{joinCalls++;return{}},participants:async()=>({participants:[{session_id:'r1',user_id:'u1',created_at:now}],directory:[{user_id:'u1',display_name:'U1'}]}),subscribe:async()=>()=>{},endRoom:async()=>room};
  const service=createLiveRoomsService({api,session,congregation,codeFactory:()=> 'ABC234'});
  await service.load();await service.join('ABC234');assert.equal(service.snapshot().room.id,'r1');
  const before=joinCalls;userId='u2';memberships=[];
  await service.load();
  assert.equal(service.snapshot().room,null,'Live Rooms retained the previous account room after account switch.');
  assert.equal(service.snapshot().participants.length,0,'Live Rooms retained the previous account participants after account switch.');
  assert.equal(joinCalls,before,'Live Rooms silently rejoined the previous room under the new account.');
}

console.log('BibleQuest V4 Section I multi-account isolation matrix passed.');
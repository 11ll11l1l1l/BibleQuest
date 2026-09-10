import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createAssignmentsService,assignmentsContract} from '../src/app/assignments.js';

const baseRow={id:'a1',congregation_id:'c1',created_by:'leader1',title:'Read John 1',instructions:'Read and reflect.',assignment_type:'reading',scripture_refs:['John 1'],target_scope:'all',target_id:null,due_at:null,points:5,active:true,created_at:'2026-09-10T00:00:00Z',updated_at:'2026-09-10T00:00:00Z',schedule_at:null,reminder_at:null,recurrence_rule:null,required_reflection:false,min_quiz_score:null,evidence_type:'none'};
const member=(role='leader',cid='c1')=>({congregationId:cid,userId:'u1',role,roleKnown:true,roleLabel:role,congregation:{id:cid,name:cid==='c1'?'Church One':'Church Two',timezone:'Asia/Tokyo'}});
let sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}},memberships=[member()],rows=[],targetCalls=[],createCalls=[],loadCalls=[];
const session={getState:()=>sessionState};
const congregation={load:async()=>memberships,assert:(cid,cap)=>{assert.equal(cid,memberships[0]?.congregationId);assert.ok(cap==='read'||cap==='ministry')}};
const targets={members:[{id:'u2',label:'Member Two',role:'member'}],teams:[{id:'t1',label:'Team One',type:'game_team'}],groups:[{id:'g1',label:'Group One'}]};
const api={
  load:async(cid,userId)=>{loadCalls.push([cid,userId]);return{assignments:rows,progress:[]}},
  targets:async cid=>{targetCalls.push(cid);return targets},
  create:async(cid,payload)=>{createCalls.push([cid,payload]);const made={...baseRow,id:`made-${createCalls.length}`,congregation_id:cid,created_by:'u1',title:payload.title,instructions:payload.instructions,assignment_type:payload.assignmentType,scripture_refs:payload.scriptureRefs,target_scope:payload.targetScope,target_id:payload.targetId,due_at:payload.dueAt,points:payload.points,schedule_at:payload.scheduleAt,reminder_at:payload.reminderAt,recurrence_rule:payload.recurrenceRule,required_reflection:payload.requiredReflection,min_quiz_score:payload.minQuizScore,evidence_type:payload.evidenceType};rows=[made];return{assignment:made}},
  start:async()=>{throw new Error('not used')},complete:async()=>{throw new Error('not used')},subscribe:async()=>()=>{}
};

assert.deepEqual(assignmentsContract.targetScopes,['all','member','team','group']);
assert.deepEqual(assignmentsContract.ministryRoles,['facilitator','leader','pastor','admin']);
assert.equal(assignmentsContract.linkedActivityPublishing,false);assert.equal(assignmentsContract.recurrenceGeneration,false);
const service=createAssignmentsService({api,session,congregation});
let state=await service.load();assert.equal(state.role,'leader');assert.equal(state.publishTargets.groups.length,0);
state=await service.loadPublishTargets();assert.equal(targetCalls.length,1);assert.equal(state.publishTargets.groups[0].id,'g1','Trusted target directory must expose a valid congregation group independent of caller membership.');

for(const [scope,targetId] of [['all',null],['member','u2'],['team','t1'],['group','g1']]){
  rows=[];const next=await service.publish({title:`Publish ${scope}`,instructions:'Study carefully.',assignmentType:'quiz',scriptureRefs:'James 1:5\nPsalm 23',targetScope:scope,targetId,points:10,dueAt:'2026-09-12T10:00',scheduleAt:'2026-09-11T10:00',reminderAt:'2026-09-11T09:00',recurrenceRule:'FREQ=WEEKLY',requiredReflection:true,minQuizScore:80,evidenceType:'confirmation'});
  const call=createCalls.at(-1);assert.equal(call[0],'c1');assert.equal(call[1].targetScope,scope);assert.equal(call[1].targetId,targetId);assert.equal(call[1].points,10);assert.equal(call[1].requiredReflection,true);assert.equal(call[1].minQuizScore,80);assert.equal(call[1].evidenceType,'confirmation');assert.equal(call[1].recurrenceRule,'FREQ=WEEKLY');assert.ok(call[1].dueAt?.endsWith('Z'));assert.equal(next.assignments[0].id,`made-${createCalls.length}`,'Publish must reload the durable server identity.');
}
assert.equal(createCalls.every(([,body])=>!('linkedActivity'in body)&&!('linked_activity'in body)),true,'#75 must not send linked activity.');

await assert.rejects(()=>service.publish({title:'Bad target',targetScope:'member',targetId:'foreign'}),error=>error.code==='BQ_ASSIGNMENT_TARGET_INVALID');
await assert.rejects(()=>service.publish({title:'X',targetScope:'all'}),error=>error.code==='BQ_ASSIGNMENT_PUBLISH_INPUT');
await assert.rejects(()=>service.publish({title:'Valid',targetScope:'group'}),error=>error.code==='BQ_ASSIGNMENT_PUBLISH_INPUT');
await assert.rejects(()=>service.publish({title:'Valid',targetScope:'all',dueAt:'not a date'}),error=>error.code==='BQ_ASSIGNMENT_PUBLISH_INPUT');

for(const role of['member','unknown']){memberships=[member(role)];await service.load();await assert.rejects(()=>service.loadPublishTargets(),error=>error.code==='BQ_ASSIGNMENT_PUBLISH_FORBIDDEN');await assert.rejects(()=>service.publish({title:'Forbidden',targetScope:'all'}),error=>error.code==='BQ_ASSIGNMENT_PUBLISH_FORBIDDEN')}
sessionState={authenticated:false,remoteAvailable:true,user:null};state=await service.load();assert.equal(state.status,'signed-out');await assert.rejects(()=>service.publish({title:'Forbidden',targetScope:'all'}),error=>error.code==='BQ_ASSIGNMENT_PUBLISH_FORBIDDEN');
sessionState={authenticated:true,remoteAvailable:false,user:{id:'u1'}};state=await service.load();assert.equal(state.status,'local-preview');
sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}};memberships=[];state=await service.load();assert.equal(state.status,'no-congregation');

let releaseTargets;const delayedApi={...api,targets:()=>new Promise(resolve=>{releaseTargets=resolve})};memberships=[member('leader','c1')];const stale=createAssignmentsService({api:delayedApi,session,congregation});await stale.load();const pending=stale.loadPublishTargets();memberships=[member('leader','c2')];await stale.load({congregationId:'c2'});releaseTargets(targets);await assert.rejects(()=>pending,error=>error.code==='BQ_ASSIGNMENT_TARGET_STALE');assert.equal(stale.snapshot().publishTargets.groups.length,0,'Stale congregation targets must not populate new state.');

memberships=[member('leader','c1')];let refreshFailure=false;const postCreate=createAssignmentsService({api:{...api,load:async(cid,user)=>{if(refreshFailure)throw new Error('network lost');return api.load(cid,user)},create:async(cid,payload)=>{const result=await api.create(cid,payload);refreshFailure=true;return result}},session,congregation});await postCreate.load();await postCreate.loadPublishTargets();await assert.rejects(()=>postCreate.publish({title:'Created once',targetScope:'all'}),error=>error.code==='BQ_ASSIGNMENT_CREATED_REFRESH_FAILED'&&/was created/.test(error.message));

const server=fs.readFileSync('supabase/functions/bq-assignment/index.ts','utf8');
assert.ok(server.includes("if(action==='targets'){if(!leaderRoles.has(member.role))"),'Trusted target action must enforce ministry authorization server-side.');
assert.ok(server.includes(".from('bible_groups').select('id,name').eq('congregation_id',congregationId).eq('active',true)"),'Trusted group target directory must be congregation-scoped and active-only.');
assert.ok(server.includes(".from('bible_congregation_members').select('user_id,display_name,role').eq('congregation_id',congregationId).eq('active',true)"),'Trusted member target directory must be congregation-scoped and active-only.');
assert.ok(server.includes(".from('bible_teams').select('id,name,team_type').eq('congregation_id',congregationId).eq('active',true)"),'Trusted team target directory must be congregation-scoped and active-only.');
assert.ok(server.includes("targetScope==='member'" )&&server.includes("activeMembership(admin,congregationId,String(targetId))"),'Server must independently reject foreign/inactive member IDs.');
assert.ok(server.includes("targetScope==='team'")&&server.includes(".eq('congregation_id',congregationId).eq('active',true).maybeSingle()"),'Server must independently reject foreign/inactive team IDs.');
assert.ok(server.includes("targetScope==='group'")&&server.includes("Journey Group not found in this congregation"),'Server must independently reject foreign/inactive group IDs.');
console.log('BibleQuest v3 Assignment Push edge regression passed.');

import assert from 'node:assert/strict';
import {createAssignmentsService,assignmentsContract} from '../src/app/assignments.js';

let sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}},memberships=[],progress=[],loadCalls=[],startCalls=[],completeCalls=[],syncCallback=null,syncCleaned=0;
const baseAssignment={id:'a1',congregation_id:'c1',created_by:'leader1',title:'Read John 1',instructions:'Read and reflect.',assignment_type:'reading',scripture_refs:['John 1'],target_scope:'all',target_id:null,due_at:'2026-09-12T10:00:00Z',points:5,active:true,created_at:'2026-09-09T00:00:00Z',updated_at:'2026-09-09T00:00:00Z'};
let assignmentRows=[baseAssignment];
const membership=(id='c1',role='member')=>({congregationId:id,userId:'u1',role,roleKnown:true,roleLabel:role,congregation:{id,name:id==='c1'?'Church One':'Church Two',timezone:'Asia/Tokyo'}});
const session={getState:()=>sessionState};
const congregation={load:async()=>memberships,assert:(id,cap)=>{assert.ok(memberships.some(row=>row.congregationId===id));assert.equal(cap,'read')}};
const api={
  load:async(congregationId,userId)=>{loadCalls.push([congregationId,userId]);return{assignments:assignmentRows.filter(row=>row.congregation_id===congregationId),progress}},
  start:async(congregationId,assignmentId)=>{startCalls.push([congregationId,assignmentId]);progress=[{assignment_id:assignmentId,user_id:'u1',status:'started',submission:null,leader_feedback:null,completed_at:null,updated_at:'2026-09-10T00:00:00Z'}];return{progress:progress[0],awarded:0,alreadyCompleted:false}},
  complete:async(congregationId,assignmentId,submission)=>{completeCalls.push([congregationId,assignmentId,submission]);const already=progress.find(row=>row.assignment_id===assignmentId)?.status==='completed';progress=[{assignment_id:assignmentId,user_id:'u1',status:'completed',submission,leader_feedback:'Keep going',completed_at:'2026-09-10T01:00:00Z',updated_at:'2026-09-10T01:00:00Z'}];return{progress:progress[0],awarded:already?0:5,alreadyCompleted:already}},
  subscribe:async(congregationId,userId,listener)=>{assert.equal(congregationId,'c1');assert.equal(userId,'u1');syncCallback=listener;return()=>{syncCleaned++}}
};

assert.deepEqual(assignmentsContract.types,['reading','guided-study','mission','quiz','reflection','couples','group','custom']);
assert.deepEqual(assignmentsContract.progressStates,['assigned','started','completed']);
assert.equal(assignmentsContract.submissionMax,4000);

memberships=[membership()];
const assignments=createAssignmentsService({api,session,congregation});
let state=await assignments.load();
assert.equal(state.status,'ready');assert.equal(state.congregationId,'c1');assert.equal(state.assignments.length,1);assert.equal(state.assignments[0].progress.status,'assigned');
assert.deepEqual(loadCalls.at(-1),['c1','u1']);
state=assignments.open('a1');assert.equal(state.activeId,'a1');state=assignments.close();assert.equal(state.activeId,'');
assert.throws(()=>assignments.open('missing'),error=>error.code==='BQ_ASSIGNMENT_NOT_FOUND');

state=assignments.open('a1');state=await assignments.start('a1');assert.equal(state.assignments[0].progress.status,'started');assert.equal(state.activeId,'a1');assert.deepEqual(startCalls,[['c1','a1']]);
const longSubmission=`  ${'x'.repeat(4100)}  `,done=await assignments.complete('a1',longSubmission);assert.equal(done.awarded,5);assert.equal(done.alreadyCompleted,false);assert.equal(done.state.assignments[0].progress.status,'completed');assert.equal(done.state.assignments[0].progress.leaderFeedback,'Keep going');assert.equal(completeCalls[0][2].length,4000,'Submission must be bounded before trusted mutation.');
const again=await assignments.complete('a1','second');assert.equal(again.awarded,0);assert.equal(again.alreadyCompleted,true,'Server idempotency result must be preserved.');

progress.push({assignment_id:'a1',user_id:'u2',status:'completed',submission:'peer secret'});state=await assignments.load();assert.equal(state.assignments[0].progress.userId,'u1');assert.notEqual(state.assignments[0].progress.submission,'peer secret','Peer progress must never replace own progress.');
progress.push({assignment_id:'other',user_id:'u1',status:'completed',submission:'other congregation'});state=await assignments.load();assert.equal(state.assignments.length,1,'Progress for non-visible assignments must be ignored.');

assignmentRows=[{...baseAssignment,congregation_id:'foreign'}];await assert.rejects(()=>assignments.load(),error=>error.code==='BQ_ASSIGNMENT_SCOPE');
assignmentRows=[{...baseAssignment,assignment_type:'invented'}];await assert.rejects(()=>assignments.load(),error=>error.code==='BQ_ASSIGNMENT_RESPONSE');
assignmentRows=[baseAssignment];progress=[];

sessionState={authenticated:false,remoteAvailable:true,user:null};state=await assignments.load();assert.equal(state.status,'signed-out');
sessionState={authenticated:true,remoteAvailable:false,user:{id:'u1'}};state=await assignments.load();assert.equal(state.status,'local-preview');
sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}};memberships=[];state=await assignments.load();assert.equal(state.status,'no-congregation');

memberships=[membership()];state=await assignments.load();
const synced=new Promise((resolve,reject)=>{assignments.watch((next,error)=>error?reject(error):resolve(next)).catch(reject)});await new Promise(resolve=>setTimeout(resolve,0));assignmentRows=[{...baseAssignment,title:'Read John 1 carefully'}];syncCallback?.();const syncedState=await synced;assert.equal(syncedState.assignments[0].title,'Read John 1 carefully','Realtime signal must reload server truth.');assignments.stopSync();assert.equal(syncCleaned,1,'Realtime channel cleanup must execute once.');

const badMutation=createAssignmentsService({api:{...api,start:async()=>({progress:{assignment_id:'wrong',user_id:'u1',status:'started'},awarded:0}),complete:api.complete},session,congregation});await badMutation.load();badMutation.open('a1');await assert.rejects(()=>badMutation.start('a1'),error=>error.code==='BQ_ASSIGNMENT_RESPONSE');
console.log('BibleQuest v3 Assignments edge regression passed.');

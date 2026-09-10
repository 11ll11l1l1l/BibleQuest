import assert from 'node:assert/strict';
import {createAssignmentsService,assignmentsContract} from '../src/app/assignments.js';

const NOW='2026-09-10T02:00:00.000Z';
let role='member',rows=[],progress=[],completeCalls=[];
const session={getState:()=>({authenticated:true,remoteAvailable:true,user:{id:'u1'}})};
const congregation={
  load:async()=>[{congregationId:'c1',userId:'u1',role,roleKnown:true,roleLabel:role,congregation:{id:'c1',name:'Test Church',timezone:'Asia/Tokyo'}}],
  assert:(id,cap)=>{assert.equal(id,'c1');assert.equal(cap,'read')}
};
const base={id:'a74',congregation_id:'c1',created_by:'leader1',title:'Advanced reflection',instructions:'Complete the task.',assignment_type:'quiz',scripture_refs:['James 1:5'],target_scope:'all',target_id:null,due_at:'2026-09-10T04:00:00Z',schedule_at:'2026-09-10T01:00:00Z',reminder_at:'2026-09-10T03:00:00Z',recurrence_rule:'FREQ=WEEKLY',required_reflection:false,min_quiz_score:null,evidence_type:'none',points:10,active:true,created_at:'2026-09-09T00:00:00Z',updated_at:'2026-09-10T00:00:00Z'};
rows=[base];
const api={
  load:async()=>({assignments:rows,progress}),
  start:async(_cid,id)=>({progress:{assignment_id:id,user_id:'u1',status:'started',submission:null,leader_feedback:null,completed_at:null,updated_at:NOW},awarded:0,alreadyCompleted:false}),
  complete:async(cid,id,submission,quizScore)=>{completeCalls.push({cid,id,submission,quizScore});const item={assignment_id:id,user_id:'u1',status:'completed',submission,leader_feedback:null,completed_at:NOW,updated_at:NOW};progress=[item];return{progress:item,awarded:10,alreadyCompleted:false}},
  subscribe:async()=>()=>{}
};
const make=()=>createAssignmentsService({api,session,congregation,now:()=>new Date(NOW)});

assert.deepEqual(assignmentsContract.evidenceTypes,['none','text','confirmation']);
assert.equal(assignmentsContract.recurrenceGeneration,false,'#74 must not invent automatic recurrence generation.');
let service=make(),state=await service.load(),item=state.assignments[0];
assert.equal(item.dueState,'open');assert.equal(item.scheduleAt,'2026-09-10T01:00:00.000Z');assert.equal(item.reminderAt,'2026-09-10T03:00:00.000Z');assert.equal(item.recurrenceRule,'FREQ=WEEKLY');

rows=[{...base,schedule_at:'2026-09-10T03:00:00Z'}];service=make();state=await service.load();service.open('a74');assert.equal(state.assignments[0].dueState,'scheduled');
await assert.rejects(()=>service.start('a74'),error=>error.code==='BQ_ASSIGNMENT_NOT_OPEN');
await assert.rejects(()=>service.complete('a74','ready'),error=>error.code==='BQ_ASSIGNMENT_NOT_OPEN');assert.equal(completeCalls.length,0,'Scheduled completion must not reach trusted API.');

rows=[{...base,schedule_at:null,due_at:'2026-09-10T01:59:59Z'}];service=make();state=await service.load();assert.equal(state.assignments[0].dueState,'overdue','Past-due incomplete assignment must be visibly overdue.');service.open('a74');await service.complete('a74','late but accepted');assert.equal(completeCalls.length,1,'Retained backend permits late completion.');state=service.snapshot();assert.equal(state.assignments[0].dueState,'completed','Completed state must outrank overdue display state.');

progress=[];completeCalls=[];rows=[{...base,required_reflection:true,schedule_at:null}];service=make();await service.load();service.open('a74');await assert.rejects(()=>service.complete('a74','   '),error=>error.code==='BQ_ASSIGNMENT_REFLECTION_REQUIRED');assert.equal(completeCalls.length,0);await service.complete('a74','My reflection');assert.equal(completeCalls[0].submission,'My reflection');

progress=[];completeCalls=[];rows=[{...base,evidence_type:'text',schedule_at:null}];service=make();await service.load();service.open('a74');await assert.rejects(()=>service.complete('a74',''),error=>error.code==='BQ_ASSIGNMENT_REFLECTION_REQUIRED');await service.complete('a74','Written evidence');assert.equal(completeCalls.length,1);

progress=[];completeCalls=[];rows=[{...base,evidence_type:'confirmation',schedule_at:null}];service=make();await service.load();service.open('a74');await assert.rejects(()=>service.complete('a74','',{}),error=>error.code==='BQ_ASSIGNMENT_CONFIRMATION_REQUIRED');assert.equal(completeCalls.length,0,'Missing confirmation must remain a client acknowledgement guard.');await service.complete('a74','',{confirmed:true});assert.equal(completeCalls.length,1);

progress=[];completeCalls=[];rows=[{...base,min_quiz_score:80,schedule_at:null}];service=make();await service.load();service.open('a74');
await assert.rejects(()=>service.complete('a74','',{quizScore:'bad'}),error=>error.code==='BQ_ASSIGNMENT_QUIZ_SCORE_INVALID');
await assert.rejects(()=>service.complete('a74','',{quizScore:79}),error=>error.code==='BQ_ASSIGNMENT_QUIZ_SCORE_REQUIRED');
await assert.rejects(()=>service.complete('a74',''),error=>error.code==='BQ_ASSIGNMENT_QUIZ_SCORE_REQUIRED');
assert.equal(completeCalls.length,0,'Below-threshold quiz completion must not invoke trusted mutation.');
await service.complete('a74','',{quizScore:80});assert.equal(completeCalls[0].quizScore,80,'Validated quiz score must be handed to trusted completion.');

for(const [patch,code] of [
  [{schedule_at:'not-a-date'},'BQ_ASSIGNMENT_RESPONSE'],
  [{reminder_at:'not-a-date'},'BQ_ASSIGNMENT_RESPONSE'],
  [{evidence_type:'photo'},'BQ_ASSIGNMENT_RESPONSE'],
  [{min_quiz_score:101},'BQ_ASSIGNMENT_RESPONSE'],
  [{min_quiz_score:-1},'BQ_ASSIGNMENT_RESPONSE']
]){progress=[];rows=[{...base,...patch}];service=make();await assert.rejects(()=>service.load(),error=>error.code===code)}

role='leader';rows=[{...base,schedule_at:null}];progress=[];service=make();await service.load();service.open('a74');await assert.rejects(()=>service.complete('a74','leader',{confirmed:true,quizScore:100}),error=>error.code==='BQ_ASSIGNMENT_ROLE_READ_ONLY');

console.log('BibleQuest v3 Advanced Assignments edge regression passed.');

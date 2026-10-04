import test from 'node:test';
import assert from 'node:assert/strict';
import { createAssignmentPreparation } from '../../src/features/curriculum-authoring/assignment-preparation.js';
import { createLessonRunner } from '../../src/features/lesson-runner/controller.js';

const pair={id:'pair-1',congregationId:'congregation-1',mentorId:'mentor-1',menteeId:'mentee-1',state:'active'};
const revisionId='lesson-revision-1';
const publishedCurriculum=[{id:'track-1',revisionId:'track-r1',title:'Foundations',position:0,modules:[{id:'module-1',revisionId:'module-r1',trackId:'track-1',title:'Start',position:0,lessons:[{id:'lesson-1',revisionId,moduleId:'module-1',title:'Assurance',position:0}]}]}];
const stepTypes=['scripture','understand','discuss','reflect','apply','pray','action'];
const lesson={id:'lesson-1',revisionId,published:true,steps:stepTypes.map((type,index)=>({id:`step-${index}`,type,content:{text:type}}))};

async function assignmentRequest(){
  const preparation=createAssignmentPreparation({
    getActorId:()=>pair.mentorId,
    discipleship:{async listPairs(){return[pair];},async loadCurriculum(){return publishedCurriculum;}},
  });
  await preparation.loadPairs();await preparation.selectPair(pair.id);preparation.selectTrack('track-1');preparation.selectModule('module-1');preparation.selectLesson('lesson-1');
  return preparation.buildRequest();
}

function runnerFor(userId,assignment,calls){
  const service={
    async listPairs(){calls.push(['listPairs']);return[pair];},
    async loadLesson(requestPairId,requestRevisionId){calls.push(['loadLesson',requestPairId,requestRevisionId]);assert.equal(requestPairId,assignment.pairId);assert.equal(requestRevisionId,assignment.lessonRevisionId);return lesson;},
    async loadOperationalProgress(requestPairId,requestRevisionId){calls.push(['progress',requestPairId,requestRevisionId]);assert.equal(requestRevisionId,assignment.lessonRevisionId);return[];},
    async loadPrivateResponses(requestPairId,requestRevisionId){calls.push(['responses',requestPairId,requestRevisionId]);assert.equal(requestRevisionId,assignment.lessonRevisionId);return[];},
  };
  const session={getState:()=>({authenticated:true,user:{id:userId}})};
  const membership={getActive:()=>({userId,congregationId:pair.congregationId})};
  return createLessonRunner({service,session,membership,pairId:assignment.pairId,revisionId:assignment.lessonRevisionId});
}

test('mentor assignment handoff opens the exact assigned revision for the mentee runner',async()=>{
  const assignment=await assignmentRequest();const calls=[];const runner=runnerFor(pair.menteeId,assignment,calls);
  assert.deepEqual(runner.getIdentity(),{pairId:assignment.pairId,revisionId:assignment.lessonRevisionId});
  await runner.load();const state=runner.getState();
  assert.equal(state.status,'ready');assert.equal(state.lesson.revisionId,assignment.lessonRevisionId);assert.equal(state.writable,true);assert.equal(state.stepIndex,0);
  assert.deepEqual(calls,[['listPairs'],['loadLesson',pair.id,revisionId],['progress',pair.id,revisionId],['responses',pair.id,revisionId]]);
});

test('the same assigned revision is review-only when opened by the paired mentor',async()=>{
  const assignment=await assignmentRequest();const calls=[];const runner=runnerFor(pair.mentorId,assignment,calls);
  await runner.load();const state=runner.getState();
  assert.equal(state.lesson.revisionId,assignment.lessonRevisionId);assert.equal(state.writable,false);assert.equal(state.status,'ready');
  assert.equal(calls.some(call=>call[0]==='responses'),false);
});

test('runner identity is pinned to the assignment handoff and cannot drift to another revision',async()=>{
  const assignment=await assignmentRequest();const calls=[];const runner=runnerFor(pair.menteeId,assignment,calls);
  const identity=runner.getIdentity();assert.equal(identity.revisionId,revisionId);assert.ok(Object.isFrozen(identity));
  publishedCurriculum[0].modules[0].lessons[0].revisionId='newer-revision';
  assert.equal(runner.getIdentity().revisionId,revisionId);
  publishedCurriculum[0].modules[0].lessons[0].revisionId=revisionId;
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { preparePublicationRequest } from '../../src/features/curriculum-authoring/publication-request.js';
import { createAssignmentPreparation } from '../../src/features/curriculum-authoring/assignment-preparation.js';

const stepTypes=['scripture','understand','discuss','reflect','apply','pray','action'];
const authoringState=()=>({
  status:'ready',tracks:[{id:'track-1',revisionId:'track-r1'}],modules:[{id:'module-1',trackId:'track-1',revisionId:'module-r1'}],lessons:[{id:'lesson-1',moduleId:'module-1',revisionId:'lesson-meta-r1'}],revisions:[{id:'lesson-revision-1',lessonId:'lesson-1'}],
  steps:stepTypes.map((stepType,position)=>({id:`step-${position}`,position,stepType})),
  selected:{trackId:'track-1',moduleId:'module-1',lessonId:'lesson-1',revisionId:'lesson-revision-1'},
  readiness:{ready:true,stepCount:7,blockers:[],libraryRevisionIds:[],request:{trackId:'track-1',moduleId:'module-1',lessonId:'lesson-1',lessonRevisionId:'lesson-revision-1',expectedTrackRevisionId:'track-r1',expectedModuleRevisionId:'module-r1',expectedLessonRevisionId:'lesson-meta-r1'}},error:null,
});

const publishedCurriculum=[{id:'track-1',revisionId:'track-r1',title:'Foundations',position:0,modules:[{id:'module-1',revisionId:'module-r1',trackId:'track-1',title:'Start',position:0,lessons:[{id:'lesson-1',revisionId:'lesson-revision-1',moduleId:'module-1',title:'Assurance',position:0}]}]}];

test('mentor journey preserves exact lesson revision identity from publication handoff to assignment handoff',async()=>{
  const publish=preparePublicationRequest(authoringState());
  const pair={id:'pair-1',mentorId:'mentor-1',menteeId:'mentee-1',state:'active'};
  const preparation=createAssignmentPreparation({
    getActorId:()=>pair.mentorId,
    discipleship:{async listPairs(){return [pair];},async loadCurriculum(requestedPairId){assert.equal(requestedPairId,pair.id);return publishedCurriculum;}},
  });
  await preparation.loadPairs();await preparation.selectPair(pair.id);preparation.selectTrack(publish.trackId);preparation.selectModule(publish.moduleId);preparation.selectLesson(publish.lessonId);
  const assignment=preparation.buildRequest();
  assert.equal(assignment.lessonRevisionId,publish.lessonRevisionId);
  assert.equal(assignment.trackId,publish.trackId);assert.equal(assignment.moduleId,publish.moduleId);assert.equal(assignment.lessonId,publish.lessonId);
  assert.equal('createAssignment' in preparation,false);
  assert.equal('publish' in publish,false);
});

test('mentor journey preparation remains read-only while shared backend blockers are unresolved',async()=>{
  const calls=[];const pair={id:'pair-1',mentorId:'mentor-1',menteeId:'mentee-1',state:'active'};
  const preparation=createAssignmentPreparation({getActorId:()=>pair.mentorId,discipleship:{async listPairs(){calls.push('list');return[pair];},async loadCurriculum(){calls.push('curriculum');return publishedCurriculum;}}});
  await preparation.loadPairs();await preparation.selectPair(pair.id);preparation.selectTrack('track-1');preparation.selectModule('module-1');preparation.selectLesson('lesson-1');preparation.buildRequest();
  assert.deepEqual(calls,['list','curriculum']);
  assert.equal(calls.some(call=>/publish|insert|assign|start/i.test(call)),false);
});

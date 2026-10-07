import test from 'node:test';
import assert from 'node:assert/strict';
import { preparePublicationRequest } from '../../src/features/curriculum-authoring/publication-request.js';
import { createCurriculumPublicationAuthority } from '../../src/features/curriculum-authoring/publication-authority.js';
import { createAssignmentPreparation } from '../../src/features/curriculum-authoring/assignment-preparation.js';
import { createV7AssignmentAuthority } from '../../src/app/v7-assignment-authority.js';

const ids=Object.freeze({
  user:'11111111-1111-1111-1111-111111111111',
  congregation:'22222222-2222-2222-2222-222222222222',
  pair:'33333333-3333-3333-3333-333333333333',
  mentee:'44444444-4444-4444-4444-444444444444',
  track:'55555555-5555-5555-5555-555555555555',
  trackRevision:'66666666-6666-6666-6666-666666666666',
  module:'77777777-7777-7777-7777-777777777777',
  moduleRevision:'88888888-8888-8888-8888-888888888888',
  lesson:'99999999-9999-9999-9999-999999999999',
  lessonMetaRevision:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  lessonRevision:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  assignment:'cccccccc-cccc-cccc-cccc-cccccccccccc',
});

const stepTypes=['scripture','understand','discuss','reflect','apply','pray','action'];
const authoringState=()=>({
  status:'ready',tracks:[{id:ids.track,revisionId:ids.trackRevision}],modules:[{id:ids.module,trackId:ids.track,revisionId:ids.moduleRevision}],lessons:[{id:ids.lesson,moduleId:ids.module,revisionId:ids.lessonMetaRevision}],revisions:[{id:ids.lessonRevision,lessonId:ids.lesson}],
  steps:stepTypes.map((stepType,position)=>({id:`step-${position}`,position,stepType})),
  selected:{trackId:ids.track,moduleId:ids.module,lessonId:ids.lesson,revisionId:ids.lessonRevision},
  readiness:{ready:true,stepCount:7,blockers:[],libraryRevisionIds:[],request:{trackId:ids.track,moduleId:ids.module,lessonId:ids.lesson,lessonRevisionId:ids.lessonRevision,expectedTrackRevisionId:ids.trackRevision,expectedModuleRevisionId:ids.moduleRevision,expectedLessonRevisionId:ids.lessonMetaRevision}},error:null,
});

const publishedCurriculum=[{id:ids.track,revisionId:ids.trackRevision,title:'Foundations',position:0,modules:[{id:ids.module,revisionId:ids.moduleRevision,trackId:ids.track,title:'Start',position:0,lessons:[{id:ids.lesson,revisionId:ids.lessonRevision,moduleId:ids.module,title:'Assurance',position:0}]}]}];

async function prepareAssignment(publish){
  const pair={id:ids.pair,mentorId:ids.user,menteeId:ids.mentee,state:'active'};
  const preparation=createAssignmentPreparation({
    getActorId:()=>pair.mentorId,
    discipleship:{async listPairs(){return [pair];},async loadAssignableCurriculum(requestedPairId){assert.equal(requestedPairId,pair.id);return publishedCurriculum;}},
  });
  await preparation.loadPairs();await preparation.selectPair(pair.id);preparation.selectTrack(publish.trackId);preparation.selectModule(publish.moduleId);preparation.selectLesson(publish.lessonId);
  return {preparation,request:preparation.buildRequest()};
}

test('mentor journey preserves exact lesson revision identity from publication handoff to assignment handoff',async()=>{
  const publish=preparePublicationRequest(authoringState());
  const {preparation,request:assignment}=await prepareAssignment(publish);
  assert.equal(assignment.lessonRevisionId,publish.lessonRevisionId);
  assert.equal(assignment.trackId,publish.trackId);assert.equal(assignment.moduleId,publish.moduleId);assert.equal(assignment.lessonId,publish.lessonId);
  assert.equal('createAssignment' in preparation,false);
  assert.equal('publish' in publish,false);
  preparation.dispose();
});

test('mentor journey calls the authoritative publication and assignment boundaries with the same immutable path',async()=>{
  const publish=preparePublicationRequest(authoringState());
  const publicationCalls=[];
  const publication=createCurriculumPublicationAuthority({
    client:{async rpc(name,args){publicationCalls.push({name,args});return {data:[{
      congregation_id:ids.congregation,track_id:ids.track,module_id:ids.module,lesson_id:ids.lesson,lesson_revision_id:ids.lessonRevision,
      track_publication_state:'published',module_publication_state:'published',lesson_publication_state:'published',published_at:'2026-10-05T00:00:00Z',
    }],error:null};}},
    getContext:()=>({userId:ids.user,congregationId:ids.congregation}),
  });
  const published=await publication.publish(publish);
  assert.equal(published.lessonRevisionId,publish.lessonRevisionId);
  assert.deepEqual(publicationCalls.map(call=>call.name),['bible_v7_publish_curriculum_path']);
  assert.equal(publicationCalls[0].args.p_lesson_revision_id,publish.lessonRevisionId);

  const {preparation,request:assignment}=await prepareAssignment(publish);
  const assignmentCalls=[];
  const authority=createV7AssignmentAuthority({
    client:{async rpc(name,args){assignmentCalls.push({name,args});return {data:[{assignment_id:ids.assignment,assignment_status:'assigned'}],error:null};}},
    session:{getState:()=>({authenticated:true,user:{id:ids.user}})},
    membership:{getActive:()=>({userId:ids.user,congregationId:ids.congregation})},
  });
  const created=await authority.createAssignment(assignment);
  assert.equal(created.id,ids.assignment);assert.equal(created.status,'assigned');
  assert.equal(created.lessonRevisionId,published.lessonRevisionId);
  assert.equal(created.pairId,ids.pair);
  assert.deepEqual(assignmentCalls.map(call=>call.name),['bible_v7_create_pair_assignment']);
  assert.deepEqual(assignmentCalls[0].args,{
    p_pair_id:ids.pair,p_track_id:ids.track,p_module_id:ids.module,p_lesson_id:ids.lesson,p_lesson_revision_id:ids.lessonRevision,
  });
  preparation.dispose();
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { preparePublicationRequest } from '../../src/features/curriculum-authoring/publication-request.js';
import { createCurriculumAuthoringFeature } from '../../src/features/curriculum-authoring/feature.js';

const types=['scripture','understand','discuss','reflect','apply','pray','action'];
const state=()=>({
  status:'ready',
  tracks:[{id:'track-1',revisionId:'track-r1'}],
  modules:[{id:'module-1',trackId:'track-1',revisionId:'module-r1'}],
  lessons:[{id:'lesson-1',moduleId:'module-1',revisionId:'lesson-r1'}],
  revisions:[{id:'revision-1',lessonId:'lesson-1'}],
  steps:types.map((stepType,position)=>({id:`step-${position}`,position,stepType})),
  selected:{trackId:'track-1',moduleId:'module-1',lessonId:'lesson-1',revisionId:'revision-1'},
  readiness:{ready:true,stepCount:7,blockers:[],libraryRevisionIds:['library-r2','library-r1'],request:{
    trackId:'track-1',moduleId:'module-1',lessonId:'lesson-1',lessonRevisionId:'revision-1',
    expectedTrackRevisionId:'track-r1',expectedModuleRevisionId:'module-r1',expectedLessonRevisionId:'lesson-r1',
  }},error:null,
});

test('returns one immutable exact request without performing publication',()=>{
  const request=preparePublicationRequest(state());
  assert.deepEqual(request,{trackId:'track-1',moduleId:'module-1',lessonId:'lesson-1',lessonRevisionId:'revision-1',expectedTrackRevisionId:'track-r1',expectedModuleRevisionId:'module-r1',expectedLessonRevisionId:'lesson-r1',libraryRevisionIds:['library-r2','library-r1']});
  assert.ok(Object.isFrozen(request));assert.ok(Object.isFrozen(request.libraryRevisionIds));
  assert.equal('publish' in request,false);
});

test('rejects stale hierarchy revisions instead of forwarding an outdated request',()=>{
  const current=state();current.tracks[0].revisionId='track-r2';
  assert.throws(()=>preparePublicationRequest(current),{code:'BQ_AUTHORING_PUBLICATION_STALE'});
});

test('rejects incomplete readiness and malformed local step sequence',()=>{
  const blocked=state();blocked.readiness={ready:false,stepCount:6,blockers:['seven_steps_incomplete'],request:null,libraryRevisionIds:[]};
  assert.throws(()=>preparePublicationRequest(blocked),{code:'BQ_AUTHORING_PUBLICATION_NOT_READY'});
  const malformed=state();malformed.steps[1]={...malformed.steps[1],stepType:'reflect'};
  assert.throws(()=>preparePublicationRequest(malformed),{code:'BQ_AUTHORING_PUBLICATION_STALE'});
});

test('rejects non-stable controller state and changed selected path',()=>{
  const busy=state();busy.status='checking';assert.throws(()=>preparePublicationRequest(busy),{code:'BQ_AUTHORING_PUBLICATION_STALE'});
  const changed=state();changed.selected.revisionId='revision-2';assert.throws(()=>preparePublicationRequest(changed),{code:'BQ_AUTHORING_PUBLICATION_STALE'});
});

test('feature composition exposes the handoff without adding a publication mutation repository',()=>{
  const feature=createCurriculumAuthoringFeature({client:{},getContext:()=>({userId:'11111111-1111-4111-8111-111111111111',congregationId:'22222222-2222-4222-8222-222222222222',canAuthor:true})});
  assert.equal(typeof feature.preparePublication,'function');
  assert.equal('publish' in feature.repositories,false);
  assert.equal('archive' in feature.repositories,false);
});

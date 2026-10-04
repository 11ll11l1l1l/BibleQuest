import test from 'node:test';
import assert from 'node:assert/strict';
import {createCurriculumAuthoringController} from '../../src/features/curriculum-authoring/controller.js';

const track={id:'track-1',revisionId:'tr-1',title:'Foundations',position:0,publicationState:'draft'};
const moduleRow={id:'module-1',trackId:track.id,revisionId:'mr-1',title:'Start',position:0,publicationState:'draft'};
const lesson={id:'lesson-1',moduleId:moduleRow.id,revisionId:'lr-1',title:'Assurance',position:0,publicationState:'draft'};
const revision={id:'revision-1',lessonId:lesson.id,revisionNumber:1,locale:'en',summary:'',publishedAt:null,editable:true};
const step={id:'step-1',revisionId:revision.id,position:0,stepType:'scripture',content:{},scriptureRefs:[],libraryRevisionId:null};
const ready={ready:false,blockers:['seven_steps_incomplete'],stepCount:1,libraryRevisionIds:[],request:null};
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return {promise,resolve,reject};}
function fixture(overrides={}){
  const calls=[];
  const tracks={
    async listTracks(){calls.push(['listTracks']);return [track];},
    async createDraft(input){calls.push(['createTrack',input]);return {...track,id:'track-2',revisionId:'tr-2',position:1};},
    async updateDraft(id,revisionId,input){calls.push(['updateTrack',id,revisionId,input]);return {...track,revisionId:'tr-2',title:input.title};},
    ...overrides.tracks,
  };
  const hierarchy={
    async listModules(id){calls.push(['listModules',id]);return [moduleRow];},
    async listLessons(trackId,moduleId){calls.push(['listLessons',trackId,moduleId]);return [lesson];},
    async createModuleDraft(trackId,input){calls.push(['createModule',trackId,input]);return {...moduleRow,id:'module-2',revisionId:'mr-2',position:1};},
    async updateModuleDraft(trackId,id,revisionId,input){calls.push(['updateModule',trackId,id,revisionId,input]);return {...moduleRow,revisionId:'mr-2',title:input.title};},
    async createLessonDraft(trackId,moduleId,input){calls.push(['createLesson',trackId,moduleId,input]);return {...lesson,id:'lesson-2',revisionId:'lr-2',position:1};},
    async updateLessonDraft(trackId,moduleId,id,revisionId,input){calls.push(['updateLesson',trackId,moduleId,id,revisionId,input]);return {...lesson,revisionId:'lr-2',title:input.title};},
    ...overrides.hierarchy,
  };
  const revisions={
    async listRevisions(trackId,moduleId,lessonId){calls.push(['listRevisions',trackId,moduleId,lessonId]);return [revision];},
    async listSteps(trackId,moduleId,lessonId,revisionId){calls.push(['listSteps',trackId,moduleId,lessonId,revisionId]);return [step];},
    async createDraftRevision(trackId,moduleId,lessonId,input){calls.push(['createRevision',trackId,moduleId,lessonId,input]);return {...revision,id:'revision-2',revisionNumber:2};},
    async saveDraftStep(trackId,moduleId,lessonId,revisionId,input){calls.push(['saveStep',trackId,moduleId,lessonId,revisionId,input]);return {...step,id:`step-${input.position+1}`,position:input.position,stepType:['scripture','understand','discuss','reflect','apply','pray','action'][input.position]};},
    ...overrides.revisions,
  };
  const readiness={async inspect(...ids){calls.push(['readiness',...ids]);return ready;},...overrides.readiness};
  return {calls,controller:createCurriculumAuthoringController({tracks,hierarchy,revisions,readiness})};
}

async function selectLessonPath(controller){await controller.load();await controller.selectTrack(track.id);await controller.selectModule(moduleRow.id);await controller.selectLesson(lesson.id);}
async function selectRevisionPath(controller){await selectLessonPath(controller);await controller.selectRevision(revision.id);}

test('controller loads and drills through hierarchy into revision steps/readiness',async()=>{
  const f=fixture();await selectRevisionPath(f.controller);const state=f.controller.getState();
  assert.equal(state.status,'ready');assert.equal(state.selected.trackId,track.id);assert.equal(state.selected.moduleId,moduleRow.id);
  assert.equal(state.selected.lessonId,lesson.id);assert.equal(state.selected.revisionId,revision.id);
  assert.deepEqual(state.steps,[step]);assert.deepEqual(state.readiness,ready);
  assert.deepEqual(f.calls.slice(-2),[['listSteps',track.id,moduleRow.id,lesson.id,revision.id],['readiness',track.id,moduleRow.id,lesson.id,revision.id]]);
});

test('newer selection suppresses a late result from an older selection',async()=>{
  const late=deferred();const f=fixture({hierarchy:{async listModules(id){f.calls.push(['listModules',id]);if(id==='old')return late.promise;return [{...moduleRow,id:'new-module'}];}}});
  await f.controller.load();const old=f.controller.selectTrack('old');const fresh=f.controller.selectTrack('new');await fresh;late.resolve([{...moduleRow,id:'old-module'}]);await old;
  assert.equal(f.controller.getState().selected.trackId,'new');assert.equal(f.controller.getState().modules[0].id,'new-module');
});

test('create operations select the new child and clear invalid deeper state',async()=>{
  const f=fixture();await f.controller.load();await f.controller.createTrack({title:'Second'});
  assert.equal(f.controller.getState().selected.trackId,'track-2');
  await f.controller.createModule({title:'Next'});assert.equal(f.controller.getState().selected.moduleId,'module-2');
  await f.controller.createLesson({title:'Lesson 2'});assert.equal(f.controller.getState().selected.lessonId,'lesson-2');
  await f.controller.createRevision({locale:'en',summary:''});const state=f.controller.getState();
  assert.equal(state.selected.revisionId,'revision-2');assert.deepEqual(state.steps,[]);assert.equal(state.readiness,null);
});

test('edit operations use the loaded optimistic revision IDs',async()=>{
  const f=fixture();await f.controller.load();await f.controller.selectTrack(track.id);await f.controller.updateTrack({title:'Revised'});
  assert.deepEqual(f.calls.at(-1),['updateTrack',track.id,'tr-1',{title:'Revised'}]);
  await f.controller.selectModule(moduleRow.id);await f.controller.updateModule({title:'Module revised'});
  assert.deepEqual(f.calls.at(-1),['updateModule',track.id,moduleRow.id,'mr-1',{title:'Module revised'}]);
  await f.controller.selectLesson(lesson.id);await f.controller.updateLesson({title:'Lesson revised'});
  assert.deepEqual(f.calls.at(-1),['updateLesson',track.id,moduleRow.id,lesson.id,'lr-1',{title:'Lesson revised'}]);
});

test('saving a step replaces its position and refreshes publication readiness',async()=>{
  const f=fixture({readiness:{async inspect(...ids){f.calls.push(['readiness',...ids]);return {...ready,stepCount:2};}}});
  await selectRevisionPath(f.controller);await f.controller.saveStep({position:1,content:{prompt:'Understand'}});
  const state=f.controller.getState();assert.equal(state.steps.length,2);assert.equal(state.steps[1].position,1);assert.equal(state.readiness.stepCount,2);
  assert.deepEqual(f.calls.slice(-2),[
    ['saveStep',track.id,moduleRow.id,lesson.id,revision.id,{position:1,content:{prompt:'Understand'}}],
    ['readiness',track.id,moduleRow.id,lesson.id,revision.id],
  ]);
});

test('refresh readiness requires a fully selected revision path',async()=>{
  const f=fixture();await f.controller.load();await assert.rejects(f.controller.refreshReadiness(),{code:'BQ_AUTHORING_SELECTION'});
  await selectRevisionPath(f.controller);await f.controller.refreshReadiness();assert.deepEqual(f.controller.getState().readiness,ready);
});

test('ordinary repository errors surface without erasing the last good selection',async()=>{
  const f=fixture({hierarchy:{async listModules(){throw new Error('database unavailable');}}});await f.controller.load();await f.controller.selectTrack(track.id);
  const state=f.controller.getState();assert.equal(state.status,'error');assert.equal(state.error,'database unavailable');assert.deepEqual(state.tracks,[track]);
});

test('invalidate and dispose cancel pending work and clear authoring state',async()=>{
  const late=deferred();const f=fixture({tracks:{async listTracks(){return late.promise;}}});let updates=0;f.controller.subscribe(()=>updates++);
  const loading=f.controller.load();f.controller.invalidate();late.resolve([track]);await loading;assert.equal(f.controller.getState().tracks.length,0);
  f.controller.dispose();assert.equal(f.controller.getState().status,'disposed');assert.equal(f.controller.getState().tracks.length,0);const before=updates;f.controller.invalidate();assert.equal(updates,before);
});

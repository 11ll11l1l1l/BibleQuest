import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createLessonRevisionAuthoringRepository, normalizeLessonRevisionDraft, normalizeLessonStepDraft,
} from '../../src/features/curriculum-authoring/lesson-revisions.js';

const user='11111111-1111-4111-8111-111111111111';
const congregation='22222222-2222-4222-8222-222222222222';
const track='33333333-3333-4333-8333-333333333333';
const moduleId='44444444-4444-4444-8444-444444444444';
const lesson='55555555-5555-4555-8555-555555555555';
const revision='66666666-6666-4666-8666-666666666666';
const step='77777777-7777-4777-8777-777777777777';
const other='88888888-8888-4888-8888-888888888888';
const trackRow=overrides=>({id:track,congregation_id:congregation,publication_state:'draft',...overrides});
const moduleRow=overrides=>({id:moduleId,track_id:track,publication_state:'draft',...overrides});
const lessonRow=overrides=>({id:lesson,module_id:moduleId,publication_state:'draft',...overrides});
const revisionRow=overrides=>({id:revision,lesson_id:lesson,revision_number:1,locale:'en',summary:'Start',published_at:null,created_by:user,...overrides});
const stepRow=overrides=>({id:step,lesson_revision_id:revision,position:0,step_type:'scripture',content:{prompt:'Read'},scripture_refs:[{book:'John',chapter:3,verse:16}],library_revision_id:null,...overrides});

function fixture(responses) {
  let scope={userId:user,congregationId:congregation,canAuthor:true};
  let index=0;const calls=[];
  const client={from(table){
    const call={table,filters:[],orders:[]};calls.push(call);
    const q={
      select(columns){call.columns=columns;return this;},eq(key,value){call.filters.push([key,value]);return this;},
      order(column,options){call.orders.push([column,options]);return this;},limit(value){call.limit=value;return this;},
      insert(value){call.insert=value;return this;},upsert(value,options){call.upsert=value;call.upsertOptions=options;return this;},
      single(){call.single=true;return this;},maybeSingle(){call.maybeSingle=true;return this;},
      then(resolve,reject){const response=typeof responses==='function'?responses(call,index++):responses[index++];return Promise.resolve(response).then(resolve,reject);},
    };return q;
  }};
  return {calls,setScope:value=>{scope=value;},repository:createLessonRevisionAuthoringRepository({client,getContext:()=>scope})};
}
const draftParentResponses=()=>[
  {data:trackRow(),error:null},{data:moduleRow(),error:null},{data:lessonRow(),error:null},
];

test('revision and seven-step normalization enforce canonical fields',()=>{
  assert.deepEqual(normalizeLessonRevisionDraft({locale:'EN-us',summary:' Start '}),{locale:'en-US',summary:'Start'});
  const pray=normalizeLessonStepDraft({position:5,content:{prompt:'Pray'},scriptureRefs:[]});
  assert.equal(pray.step_type,'pray');
  assert.equal(pray.library_revision_id,null);
  for(const fn of [
    ()=>normalizeLessonRevisionDraft({locale:'bad_locale',summary:''}),
    ()=>normalizeLessonRevisionDraft({locale:'en',published_at:'now'}),
    ()=>normalizeLessonStepDraft({position:7,content:{}}),
    ()=>normalizeLessonStepDraft({position:0,content:{bad:undefined}}),
    ()=>normalizeLessonStepDraft({position:0,content:{bad:Infinity}}),
    ()=>normalizeLessonStepDraft({position:0,content:[]}),
  ]) assert.throws(fn,{code:'BQ_AUTHORING_CONTENT'});
});

test('revision listing verifies the entire editable hierarchy and bounds results',async()=>{
  const f=fixture([...draftParentResponses(),{data:[revisionRow()],error:null}]);
  const result=await f.repository.listRevisions(track,moduleId,lesson);
  assert.equal(result[0].revisionNumber,1);
  assert.deepEqual(f.calls[0].filters,[['id',track],['congregation_id',congregation]]);
  assert.deepEqual(f.calls[1].filters,[['id',moduleId],['track_id',track]]);
  assert.deepEqual(f.calls[2].filters,[['id',lesson],['module_id',moduleId]]);
  assert.equal(f.calls[3].limit,100);
});

test('draft revision creation derives actor and next revision number',async()=>{
  const f=fixture([...draftParentResponses(),{data:[{revision_number:2}],error:null},{data:revisionRow({revision_number:3}),error:null}]);
  const created=await f.repository.createDraftRevision(track,moduleId,lesson,{locale:'en',summary:'Next'});
  assert.equal(created.revisionNumber,3);
  assert.deepEqual(f.calls[4].insert,{lesson_id:lesson,revision_number:3,locale:'en',summary:'Next',created_by:user});
});

test('draft revision creation starts at one and surfaces database races without retrying',async()=>{
  const denial=new Error('duplicate key');
  const f=fixture([...draftParentResponses(),{data:[],error:null},{data:null,error:denial}]);
  await assert.rejects(f.repository.createDraftRevision(track,moduleId,lesson,{locale:'en',summary:''}),error=>error===denial);
  assert.equal(f.calls.filter(call=>call.insert).length,1);
});

test('published hierarchy blocks revision creation before revision queries',async()=>{
  const f=fixture([{data:trackRow({publication_state:'published'}),error:null}]);
  await assert.rejects(f.repository.createDraftRevision(track,moduleId,lesson,{locale:'en',summary:''}),{code:'BQ_AUTHORING_CONFLICT'});
  assert.equal(f.calls.length,1);
});

test('step listing requires an editable revision and returns canonical order',async()=>{
  const f=fixture([...draftParentResponses(),{data:revisionRow(),error:null},{data:[stepRow()],error:null}]);
  const result=await f.repository.listSteps(track,moduleId,lesson,revision);
  assert.equal(result[0].stepType,'scripture');
  assert.equal(f.calls[4].limit,7);
  assert.deepEqual(f.calls[4].filters,[['lesson_revision_id',revision]]);
});

test('published revisions are immutable in the authoring repository',async()=>{
  const f=fixture([...draftParentResponses(),{data:revisionRow({published_at:'2026-10-04T00:00:00Z'}),error:null}]);
  await assert.rejects(f.repository.saveDraftStep(track,moduleId,lesson,revision,{position:0,content:{prompt:'Read'}}),{code:'BQ_AUTHORING_CONFLICT'});
  assert.equal(f.calls.length,4);
});

test('saving a step derives canonical type and uses one-position upsert',async()=>{
  const input={position:4,content:{prompt:'Apply this'},scriptureRefs:[{ref:'James 1:22'}],libraryRevisionId:other};
  const f=fixture([...draftParentResponses(),{data:revisionRow(),error:null},{data:stepRow({position:4,step_type:'apply',content:input.content,scripture_refs:input.scriptureRefs,library_revision_id:other}),error:null}]);
  const saved=await f.repository.saveDraftStep(track,moduleId,lesson,revision,input);
  assert.equal(saved.stepType,'apply');
  assert.equal(f.calls[4].upsert.step_type,'apply');
  assert.equal(f.calls[4].upsert.lesson_revision_id,revision);
  assert.deepEqual(f.calls[4].upsertOptions,{onConflict:'lesson_revision_id,position'});
});

test('duplicate or malformed step responses are rejected',async()=>{
  const duplicate=fixture([...draftParentResponses(),{data:revisionRow(),error:null},{data:[stepRow(),stepRow({id:other})],error:null}]);
  await assert.rejects(duplicate.repository.listSteps(track,moduleId,lesson,revision),{code:'BQ_AUTHORING_RESPONSE'});
  const mismatch=fixture([...draftParentResponses(),{data:revisionRow(),error:null},{data:stepRow({step_type:'pray'}),error:null}]);
  await assert.rejects(mismatch.repository.saveDraftStep(track,moduleId,lesson,revision,{position:0,content:{}}),{code:'BQ_AUTHORING_RESPONSE'});
});

test('account changes invalidate in-flight parent reads',async()=>{
  let f;
  f=fixture((call,index)=>{
    if(index===0){f.setScope({userId:other,congregationId:congregation,canAuthor:true});return {data:trackRow(),error:null};}
    return {data:null,error:null};
  });
  await assert.rejects(f.repository.listRevisions(track,moduleId,lesson),{code:'BQ_AUTHORING_CONTEXT_STALE'});
  assert.equal(f.calls.length,1);
});

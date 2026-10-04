import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createHierarchyAuthoringRepository, normalizeLessonDraft, normalizeModuleDraft,
} from '../../src/features/curriculum-authoring/hierarchy.js';

const user='11111111-1111-4111-8111-111111111111';
const congregation='22222222-2222-4222-8222-222222222222';
const track='33333333-3333-4333-8333-333333333333';
const moduleId='44444444-4444-4444-8444-444444444444';
const lesson='55555555-5555-4555-8555-555555555555';
const revision='66666666-6666-4666-8666-666666666666';
const next='77777777-7777-4777-8777-777777777777';
const other='88888888-8888-4888-8888-888888888888';
const trackRow=overrides=>({id:track,congregation_id:congregation,publication_state:'draft',...overrides});
const moduleRow=overrides=>({id:moduleId,track_id:track,title:'Basics',summary:'Start here',revision_id:revision,
  display_order:0,publication_state:'draft',...overrides});
const lessonRow=overrides=>({id:lesson,module_id:moduleId,title:'Assurance',revision_id:revision,
  display_order:0,publication_state:'draft',...overrides});

function fixture(responses) {
  let scope={userId:user,congregationId:congregation,canAuthor:true};
  let responseIndex=0;
  const calls=[];
  const client={from(table) {
    const call={table,filters:[],orders:[]};calls.push(call);
    const q={
      select(columns){call.columns=columns;return this;},
      order(column){call.orders.push(column);return this;},
      limit(value){call.limit=value;return this;},
      insert(value){call.insert=value;return this;},
      update(value){call.update=value;return this;},
      eq(key,value){call.filters.push([key,value]);return this;},
      single(){call.single=true;return this;},maybeSingle(){call.maybeSingle=true;return this;},
      then(resolve,reject){
        const response=typeof responses==='function' ? responses(call,responseIndex++) : responses[responseIndex++];
        return Promise.resolve(response).then(resolve,reject);
      },
    };return q;
  }};
  return {calls,setScope:value=>{scope=value;},repository:createHierarchyAuthoringRepository({
    client,getContext:()=>scope,newRevisionId:()=>next,
  })};
}

test('module and lesson draft validation rejects authority fields and invalid order',()=>{
  assert.deepEqual(normalizeModuleDraft({title:' Basics ',summary:' Start ',position:2}),
    {title:'Basics',summary:'Start',display_order:2});
  assert.deepEqual(normalizeLessonDraft({title:' Assurance ',position:1}),{title:'Assurance',display_order:1});
  for (const value of [
    ()=>normalizeModuleDraft({title:'x'.repeat(241),position:0}),
    ()=>normalizeModuleDraft({title:'Basics',position:-1}),
    ()=>normalizeModuleDraft({title:'Basics',position:0,track_id:track}),
    ()=>normalizeLessonDraft({title:'Assurance',position:0,publication_state:'published'}),
  ]) assert.throws(value,{code:'BQ_AUTHORING_CONTENT'});
});

test('module list proves the parent track is in scope and bounds returned children',async()=>{
  const f=fixture([{data:trackRow(),error:null},{data:[moduleRow()],error:null}]);
  const result=await f.repository.listModules(track);
  assert.equal(result[0].id,moduleId);
  assert.deepEqual(f.calls[0].filters,[['id',track],['congregation_id',congregation]]);
  assert.deepEqual(f.calls[1].filters,[['track_id',track]]);
  assert.equal(f.calls[1].limit,100);
});

test('module creation requires an editable parent and derives parent/state internally',async()=>{
  const f=fixture([{data:trackRow(),error:null},{data:moduleRow(),error:null}]);
  assert.equal((await f.repository.createModuleDraft(track,{title:'Basics',summary:'Start here',position:0})).publicationState,'draft');
  assert.deepEqual(f.calls[1].insert,{title:'Basics',summary:'Start here',display_order:0,track_id:track,publication_state:'draft'});
});

test('module edits use optimistic revision and exact parent/draft filters',async()=>{
  const f=fixture([{data:trackRow(),error:null},{data:moduleRow({revision_id:next}),error:null}]);
  assert.equal((await f.repository.updateModuleDraft(track,moduleId,revision,{title:'Basics',summary:'Revised',position:1})).revisionId,next);
  assert.deepEqual(f.calls[1].filters,[['id',moduleId],['track_id',track],['publication_state','draft'],['revision_id',revision]]);
  assert.equal(f.calls[1].update.revision_id,next);
});

test('published parent stops module mutation before a child write',async()=>{
  const f=fixture([{data:trackRow({publication_state:'published'}),error:null}]);
  await assert.rejects(f.repository.createModuleDraft(track,{title:'Basics',position:0}),{code:'BQ_AUTHORING_CONFLICT'});
  assert.equal(f.calls.length,1);
});

test('lesson list verifies both track scope and module ownership before reading children',async()=>{
  const f=fixture([
    {data:trackRow(),error:null},{data:moduleRow(),error:null},{data:[lessonRow()],error:null},
  ]);
  const result=await f.repository.listLessons(track,moduleId);
  assert.equal(result[0].id,lesson);
  assert.deepEqual(f.calls[1].filters,[['id',moduleId],['track_id',track]]);
  assert.deepEqual(f.calls[2].filters,[['module_id',moduleId]]);
});

test('lesson creation requires draft track/module and derives module/state internally',async()=>{
  const f=fixture([
    {data:trackRow(),error:null},{data:moduleRow(),error:null},{data:lessonRow(),error:null},
  ]);
  assert.equal((await f.repository.createLessonDraft(track,moduleId,{title:'Assurance',position:0})).publicationState,'draft');
  assert.deepEqual(f.calls[2].insert,{title:'Assurance',display_order:0,module_id:moduleId,publication_state:'draft'});
});

test('lesson edits rotate revision and reject stale no-row updates',async()=>{
  const good=fixture([
    {data:trackRow(),error:null},{data:moduleRow(),error:null},{data:lessonRow({revision_id:next}),error:null},
  ]);
  assert.equal((await good.repository.updateLessonDraft(track,moduleId,lesson,revision,{title:'Assurance',position:1})).revisionId,next);
  assert.deepEqual(good.calls[2].filters,[['id',lesson],['module_id',moduleId],['publication_state','draft'],['revision_id',revision]]);
  const stale=fixture([{data:trackRow(),error:null},{data:moduleRow(),error:null},{data:null,error:null}]);
  await assert.rejects(stale.repository.updateLessonDraft(track,moduleId,lesson,revision,{title:'Assurance',position:0}),{code:'BQ_AUTHORING_CONFLICT'});
});

test('foreign hierarchy responses are rejected instead of being normalized into the active scope',async()=>{
  const f=fixture([{data:trackRow(),error:null},{data:[moduleRow({track_id:other})],error:null}]);
  await assert.rejects(f.repository.listModules(track),{code:'BQ_AUTHORING_RESPONSE'});
});

test('context changes and database denials fail without retrying writes',async()=>{
  let f;
  f=fixture((call,index)=>{
    if(index===0) { f.setScope({userId:other,congregationId:congregation,canAuthor:true}); return {data:trackRow(),error:null}; }
    return {data:null,error:null};
  });
  await assert.rejects(f.repository.listModules(track),{code:'BQ_AUTHORING_CONTEXT_STALE'});
  assert.equal(f.calls.length,1);

  const denial=new Error('permission denied');
  const denied=fixture([{data:trackRow(),error:null},{data:null,error:denial}]);
  await assert.rejects(denied.repository.createModuleDraft(track,{title:'Basics',position:0}),error=>error===denial);
  assert.equal(denied.calls.length,2);
});

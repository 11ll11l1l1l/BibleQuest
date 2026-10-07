import test from 'node:test';
import assert from 'node:assert/strict';
import {createPublicationReadinessRepository} from '../../src/features/curriculum-authoring/publication-readiness.js';

const user='11111111-1111-4111-8111-111111111111';
const congregation='22222222-2222-4222-8222-222222222222';
const track='33333333-3333-4333-8333-333333333333';
const moduleId='44444444-4444-4444-8444-444444444444';
const lesson='55555555-5555-4555-8555-555555555555';
const revision='66666666-6666-4666-8666-666666666666';
const trackRevision='77777777-7777-4777-8777-777777777777';
const moduleRevision='88888888-8888-4888-8888-888888888888';
const lessonRevision='99999999-9999-4999-8999-999999999999';
const libraryRevision='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const types=['scripture','understand','discuss','reflect','apply','pray','action'];
const parentRows=overrides=>[
  {data:{id:track,congregation_id:congregation,revision_id:trackRevision,publication_state:'draft',...(overrides?.track||{})},error:null},
  {data:{id:moduleId,track_id:track,revision_id:moduleRevision,publication_state:'draft',...(overrides?.module||{})},error:null},
  {data:{id:lesson,module_id:moduleId,revision_id:lessonRevision,publication_state:'draft',...(overrides?.lesson||{})},error:null},
  {data:{id:revision,lesson_id:lesson,published_at:null,...(overrides?.revision||{})},error:null},
];
const steps=(count=7)=>Array.from({length:count},(_,position)=>({
  id:`${String(position+1).padStart(8,'0')}-0000-4000-8000-000000000000`,lesson_revision_id:revision,position,
  step_type:types[position],library_revision_id:position===0?libraryRevision:null,
}));
function fixture(responses){
  let scope={userId:user,congregationId:congregation,canAuthor:true};let index=0;const calls=[];
  const client={from(table){const call={table,filters:[]};calls.push(call);const q={
    select(columns){call.columns=columns;return this;},eq(key,value){call.filters.push([key,value]);return this;},
    order(column){call.order=column;return this;},limit(value){call.limit=value;return this;},maybeSingle(){call.maybeSingle=true;return this;},
    then(resolve,reject){const response=typeof responses==='function'?responses(call,index++):responses[index++];return Promise.resolve(response).then(resolve,reject);},
  };return q;}};
  return {calls,setScope:value=>{scope=value;},repository:createPublicationReadinessRepository({client,getContext:()=>scope})};
}

test('complete draft path produces an immutable atomic publish request',async()=>{
  const f=fixture([...parentRows(),{data:steps(),error:null}]);
  const result=await f.repository.inspect(track,moduleId,lesson,revision);
  assert.equal(result.ready,true);assert.deepEqual(result.blockers,[]);assert.equal(result.stepCount,7);
  assert.deepEqual(result.libraryRevisionIds,[libraryRevision]);
  assert.deepEqual(result.request,{trackId:track,moduleId,lessonId:lesson,lessonRevisionId:revision,
    expectedTrackRevisionId:trackRevision,expectedModuleRevisionId:moduleRevision,expectedLessonRevisionId:lessonRevision});
  assert.throws(()=>result.blockers.push('x'),TypeError);
});

test('non-draft hierarchy and published revision report blockers without preparing mutation',async()=>{
  const f=fixture([...parentRows({track:{publication_state:'published'},module:{publication_state:'withdrawn'},lesson:{publication_state:'published'},revision:{published_at:'2026-10-04T00:00:00Z'}}),{data:steps(),error:null}]);
  const result=await f.repository.inspect(track,moduleId,lesson,revision);
  assert.equal(result.ready,false);assert.equal(result.request,null);
  assert.deepEqual(result.blockers,['track_not_draft','module_not_draft','lesson_not_draft','revision_already_published']);
});

test('incomplete seven-step lesson reports readiness blocker',async()=>{
  const f=fixture([...parentRows(),{data:steps(6),error:null}]);
  const result=await f.repository.inspect(track,moduleId,lesson,revision);
  assert.equal(result.ready,false);assert.deepEqual(result.blockers,['seven_steps_incomplete']);assert.equal(result.stepCount,6);
});

test('malformed or duplicate step sequence fails closed',async()=>{
  const malformed=steps();malformed[2]={...malformed[2],step_type:'pray'};
  let f=fixture([...parentRows(),{data:malformed,error:null}]);
  await assert.rejects(f.repository.inspect(track,moduleId,lesson,revision),{code:'BQ_AUTHORING_RESPONSE'});
  const duplicate=steps();duplicate[6]={...duplicate[6],position:5,step_type:'pray'};
  f=fixture([...parentRows(),{data:duplicate,error:null}]);
  await assert.rejects(f.repository.inspect(track,moduleId,lesson,revision),{code:'BQ_AUTHORING_RESPONSE'});
});

test('foreign or mismatched parent responses are never converted into readiness data',async()=>{
  const f=fixture([{data:{...parentRows()[0].data,congregation_id:libraryRevision},error:null}]);
  await assert.rejects(f.repository.inspect(track,moduleId,lesson,revision),{code:'BQ_AUTHORING_RESPONSE'});
  assert.equal(f.calls.length,1);
});

test('queries bind exact IDs, congregation and bound the step response',async()=>{
  const f=fixture([...parentRows(),{data:steps(),error:null}]);await f.repository.inspect(track,moduleId,lesson,revision);
  assert.deepEqual(f.calls[0].filters,[['id',track],['congregation_id',congregation]]);
  assert.deepEqual(f.calls[1].filters,[['id',moduleId],['track_id',track]]);
  assert.deepEqual(f.calls[2].filters,[['id',lesson],['module_id',moduleId]]);
  assert.deepEqual(f.calls[3].filters,[['id',revision],['lesson_id',lesson]]);
  assert.deepEqual(f.calls[4].filters,[['lesson_revision_id',revision]]);assert.equal(f.calls[4].limit,8);
});

test('capability denial and malformed identifiers fail before database access',async()=>{
  const f=fixture([]);f.setScope({userId:user,congregationId:congregation,canAuthor:false});
  await assert.rejects(f.repository.inspect(track,moduleId,lesson,revision),{code:'BQ_AUTHORING_DENIED'});
  f.setScope({userId:user,congregationId:congregation,canAuthor:true});
  await assert.rejects(f.repository.inspect('bad',moduleId,lesson,revision),{code:'BQ_AUTHORING_ID'});
  assert.equal(f.calls.length,0);
});

test('account changes invalidate in-flight readiness and database errors propagate once',async()=>{
  let f;f=fixture((call,index)=>{if(index===0){f.setScope({userId:libraryRevision,congregationId:congregation,canAuthor:true});return parentRows()[0];}return {data:null,error:null};});
  await assert.rejects(f.repository.inspect(track,moduleId,lesson,revision),{code:'BQ_AUTHORING_CONTEXT_STALE'});assert.equal(f.calls.length,1);
  const denial=new Error('permission denied');const denied=fixture([{data:null,error:denial}]);
  await assert.rejects(denied.repository.inspect(track,moduleId,lesson,revision),error=>error===denial);assert.equal(denied.calls.length,1);
});

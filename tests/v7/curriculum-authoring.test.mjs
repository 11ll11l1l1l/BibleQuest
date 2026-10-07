import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrackAuthoringRepository, normalizeTrackDraft } from '../../src/features/curriculum-authoring/tracks.js';
const user='11111111-1111-4111-8111-111111111111';
const congregation='22222222-2222-4222-8222-222222222222';
const track='33333333-3333-4333-8333-333333333333';
const revision='44444444-4444-4444-8444-444444444444';
const next='55555555-5555-4555-8555-555555555555';
const draft={title:' Foundations ',locale:'en',summary:'A track',audience:'Adults',position:0};
const row=overrides=>({id:track,congregation_id:congregation,created_by:user,title:'Foundations',summary:'A track',
  locale:'en',audience:'Adults',display_order:0,revision_id:revision,publication_state:'draft',...overrides});
function fixture(response) {
  let scope={userId:user,congregationId:congregation,canAuthor:true};
  const calls=[];
  const client={from(table) {
    const call={table,filters:[]};calls.push(call);
    const q={
      select(columns){call.columns=columns;return this;},order(){return this;},limit(value){call.limit=value;return this;},
      insert(value){call.insert=value;return this;},update(value){call.update=value;return this;},
      eq(key,value){call.filters.push([key,value]);return this;},
      single(){return this;},maybeSingle(){return this;},
      then(resolve,reject){return Promise.resolve(typeof response==='function'?response():response).then(resolve,reject);},
    };return q;
  }};
  return {calls,client,getContext:()=>scope,setScope:value=>{scope=value;},
    repository:createTrackAuthoringRepository({client,getContext:()=>scope,newRevisionId:()=>next})};
}
test('draft validation bounds title/order and refuses authority fields',()=>{
  assert.equal(normalizeTrackDraft(draft).title,'Foundations');
  for(const value of [{...draft,title:'x'.repeat(241)},{...draft,position:-1},{...draft,locale:['en']},
    {...draft,created_by:user},{...draft,publication_state:'published'}]) {
    assert.throws(()=>normalizeTrackDraft(value),{code:'BQ_AUTHORING_CONTENT'});
  }
});
test('draft create derives actor and tenant from composition and always writes draft',async()=>{
  const f=fixture({data:row(),error:null});
  assert.equal((await f.repository.createDraft(draft)).publicationState,'draft');
  assert.equal(f.calls[0].insert.created_by,user);
  assert.equal(f.calls[0].insert.congregation_id,congregation);
  assert.equal(f.calls[0].insert.publication_state,'draft');
});
test('draft update filters expected revision, draft state and tenant',async()=>{
  const f=fixture({data:row({revision_id:next}),error:null});
  assert.equal((await f.repository.updateDraft(track,revision,draft)).revisionId,next);
  assert.deepEqual(f.calls[0].filters,[['id',track],['congregation_id',congregation],['publication_state','draft'],['revision_id',revision]]);
});
test('stale or published draft edits return conflict rather than silent success',async()=>{
  const f=fixture({data:null,error:null});
  await assert.rejects(f.repository.updateDraft(track,revision,draft),{code:'BQ_AUTHORING_CONFLICT'});
});
test('denied capability and malformed identifiers fail before queries',async()=>{
  const f=fixture({data:row(),error:null});
  f.setScope({userId:user,congregationId:congregation,canAuthor:false});
  await assert.rejects(f.repository.createDraft(draft),{code:'BQ_AUTHORING_DENIED'});
  f.setScope({userId:user,congregationId:congregation,canAuthor:true});
  await assert.rejects(f.repository.updateDraft('id),x',revision,draft),{code:'BQ_AUTHORING_ID'});
  assert.equal(f.calls.length,0);
});
test('late responses after account changes are rejected and cannot surface prior drafts',async()=>{
  const f=fixture(()=>{f.setScope({userId:next,congregationId:congregation,canAuthor:true});return {data:[row()],error:null};});
  await assert.rejects(f.repository.listTracks(),{code:'BQ_AUTHORING_CONTEXT_STALE'});
});
test('track list is bounded and rejects foreign tenant responses',async()=>{
  const f=fixture({data:[row({congregation_id:next})],error:null});
  await assert.rejects(f.repository.listTracks(),{code:'BQ_AUTHORING_RESPONSE'});
  assert.equal(f.calls[0].limit,100);
  assert.deepEqual(f.calls[0].filters,[['congregation_id',congregation]]);
});
test('database denial is propagated without retrying the write',async()=>{
  const denial=new Error('permission denied');
  const f=fixture({data:null,error:denial});
  await assert.rejects(f.repository.createDraft(draft),error=>error===denial);
  assert.equal(f.calls.length,1);
});

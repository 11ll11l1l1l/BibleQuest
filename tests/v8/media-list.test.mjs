import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMediaListFilters} from '../../supabase/functions/_shared/media/policy.mjs';
import {createSupabaseMediaRepository} from '../../supabase/functions/_shared/media/repository.mjs';
import {createMediaService} from '../../supabase/functions/_shared/media/service.mjs';

const userId='11111111-1111-4111-8111-111111111111';
const actor={userId,congregationId:'church',active:true,role:'member'};
const row={id:'22222222-2222-4222-8222-222222222222',congregationId:'church',ownerUserId:userId,name:'Private.pdf',mimeType:'application/pdf',byteSize:20,state:'pending_review',revision:1,createdAt:'2026-11-01T00:00:00Z',objectId:'PROVIDER_SECRET',rightsVerified:true,safetyVerified:true};
const quota={enabled:true,usedBytes:0,reservedBytes:0,capacityBytes:1000};
test('list filters normalize explicit values and reject malformed or oversized input',()=>{
  assert.deepEqual(normalizeMediaListFilters({query:'  Sunday   notes  ',scope:'mine',state:'published'}),{query:'Sunday notes',scope:'mine',state:'published'});
  for(const input of [null,[],{scope:'other-user'},{state:'published,owner_user_id.not.is.null'},{query:'*'},{query:'％＊'},{query:'a'.repeat(81)},{query:'bad\nquery'},{query:5}]) assert.throws(()=>normalizeMediaListFilters(input),{code:'MEDIA_FILTER_INVALID'});
});
function queryFixture() {
  const calls=[];
  const query={then:resolve=>Promise.resolve({data:[],error:null}).then(resolve)};
  for(const method of ['select','eq','ilike','or','order','limit'])query[method]=(...args)=>{calls.push([method,...args]);return query;};
  const repo=createSupabaseMediaRepository({actorUserId:userId,admin:{from:table=>{calls.push(['from',table]);return query;},rpc(){}}});
  return {calls,repo};
}
test('repository filter query ANDs tenant, owner, status, escaped filename and visibility with stable pagination',async()=>{
  const f=queryFixture();
  await f.repo.list('church',{filters:{scope:'mine',state:'pending_review',query:'100%_notes\\x'},cursor:{createdAt:row.createdAt,id:row.id},limit:31});
  assert.ok(f.calls.some(call=>JSON.stringify(call)===JSON.stringify(['eq','congregation_id','church'])));
  assert.ok(f.calls.some(call=>JSON.stringify(call)===JSON.stringify(['eq','owner_user_id',userId])));
  assert.ok(f.calls.some(call=>JSON.stringify(call)===JSON.stringify(['eq','state','pending_review'])));
  assert.deepEqual(f.calls.find(call=>call[0]==='ilike'),['ilike','name','%100\\%\\_notes\\\\x%']);
  const predicate=f.calls.find(call=>call[0]==='or')[1];
  assert.ok(predicate.includes(`or(state.eq.published,owner_user_id.eq.${userId})`));
  assert.ok(predicate.includes(`created_at.lt.${row.createdAt}`));
  assert.doesNotMatch(predicate,/100|notes/);
  assert.deepEqual(f.calls.filter(call=>call[0]==='order'),[['order','created_at',{ascending:false}],['order','id',{ascending:false}]]);
  assert.deepEqual(f.calls.at(-1),['limit',31]);
});
test('reviewer scope still has tenant restriction; malformed cursor fails before query execution',async()=>{
  const f=queryFixture();await f.repo.list('church',{reviewer:true,filters:{state:'removed'}});
  assert.ok(f.calls.some(call=>call[0]==='eq'&&call[1]==='congregation_id'&&call[2]==='church'));
  assert.ok(!f.calls.some(call=>call[0]==='or'));
  await assert.rejects(f.repo.list('church',{cursor:{createdAt:'now),or(id.not.is.null',id:row.id}}),{code:'MEDIA_REQUEST_INVALID'});
});
function serviceFixture({rows=[row],getActor=()=>actor}={}){
  const calls=[];
  const repository={list:async(...args)=>{calls.push(args);return rows;},quota:async()=>quota};
  return {calls,service:createMediaService({authorize:async()=>getActor(),repository,provider:{}})};
}
test('service derives review rights from current membership, binds cursor to filters and redacts provider identity',async()=>{
  const f=serviceFixture({rows:Array.from({length:31},(_,index)=>({...row,id:`asset-${index}`}))});
  const filters={scope:'mine',state:'pending_review',query:' notes '};
  const result=await f.service.list({}, {congregationId:'church',filters,reviewer:true});
  assert.equal(f.calls[0][1].reviewer,false);
  assert.equal(result.canReview,false);
  assert.equal(result.assets.length,30);
  assert.equal(result.assets[0].own,true);
  assert.equal(result.assets[0].rightsVerified,undefined);
  assert.doesNotMatch(JSON.stringify(result),/PROVIDER_SECRET|ownerUserId/);
  assert.deepEqual(result.cursor.filters,{scope:'mine',state:'pending_review',query:'notes'});
  await f.service.list({}, {congregationId:'church',filters,cursor:result.cursor});
  await assert.rejects(f.service.list({}, {congregationId:'church',filters:{scope:'all'},cursor:result.cursor}),{code:'MEDIA_CURSOR_FILTER_MISMATCH'});
  assert.equal(f.calls.length,2);
});
test('list releases no rows after role/account/scope changes or unauthorized repository results',async()=>{
  for(const changed of [{...actor,role:'leader'},{...actor,userId:'other'},{...actor,active:false}]){
    let count=0;const f=serviceFixture({getActor:()=>++count===1?actor:changed});
    await assert.rejects(f.service.list({}, {congregationId:'church'}),{code:'MEDIA_SCOPE_DENIED'});
  }
  for(const bad of [{...row,congregationId:'other'},{...row,ownerUserId:'other'}]){
    const f=serviceFixture({rows:[bad]});await assert.rejects(f.service.list({}, {congregationId:'church',filters:{state:'pending_review'}}),{code:'MEDIA_SCOPE_DENIED'});
  }
});
test('member can list published and own pending; current reviewer can list moderation queue',async()=>{
  const member=serviceFixture({rows:[row,{...row,id:'public',state:'published',ownerUserId:'other'}]});
  assert.equal((await member.service.list({}, {congregationId:'church'})).assets.length,2);
  const leader=serviceFixture({rows:[{...row,ownerUserId:'other'}],getActor:()=>({...actor,role:'leader'})});
  const result=await leader.service.list({}, {congregationId:'church',filters:{state:'pending_review'}});
  assert.equal(leader.calls[0][1].reviewer,true);assert.equal(result.assets[0].rightsVerified,true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiscipleshipPairRepository } from '../../src/app/discipleship-pair-repository.js';

const userId='00000000-0000-4000-8000-000000000001';
const congregationId='00000000-0000-4000-8000-000000000002';
const pairId='00000000-0000-4000-8000-000000000003';
const menteeId='00000000-0000-4000-8000-000000000004';
const outsiderId='00000000-0000-4000-8000-000000000005';
const context={userId,congregationId};

function pair(overrides={}) {
  return {id:pairId,congregation_id:congregationId,mentor_id:userId,mentee_id:menteeId,initiated_by:userId,state:'invited',mentor_accepted_at:null,mentee_accepted_at:null,ended_at:null,updated_at:'2026-10-04T00:00:00Z',...overrides};
}
function setup({account=userId,insertRow=pair(),rpcRow=pair(),insertError=null,rpcError=null}={}) {
  const calls=[];
  let result={data:insertRow,error:insertError};
  const query={
    insert(value){calls.push(['insert',value]);result={data:insertRow,error:insertError};return query},
    select(value){calls.push(['select',value]);return query},
    single(){calls.push(['single']);return query},
    then(resolve,reject){return Promise.resolve(result).then(resolve,reject)},
  };
  const client={
    auth:{getUser:async()=>({data:{user:{id:account}},error:null})},
    from(name){calls.push(['from',name]);return query},
    async rpc(name,args){calls.push(['rpc',name,args]);return {data:rpcRow,error:rpcError}},
  };
  return {repository:createDiscipleshipPairRepository(async()=>client),calls};
}

test('pair invitation sends only the clean invited lifecycle shape',async()=>{
  const {repository,calls}=setup();
  const result=await repository.invitePair({mentorId:userId,menteeId},context);
  assert.equal(result.id,pairId);
  const payload=calls.find(call=>call[0]==='insert')?.[1];
  assert.deepEqual(payload,{congregation_id:congregationId,mentor_id:userId,mentee_id:menteeId,initiated_by:userId,state:'invited'});
  assert.equal(Object.hasOwn(payload,'mentor_accepted_at'),false);
  assert.equal(Object.hasOwn(payload,'mentee_accepted_at'),false);
  assert.equal(Object.hasOwn(payload,'ended_at'),false);
});

test('pair invitation rejects invalid role shape before a database insert',async()=>{
  const first=setup();
  await assert.rejects(first.repository.invitePair({mentorId:userId,menteeId:userId},context),/different accounts/);
  assert.equal(first.calls.some(call=>call[0]==='insert'),false);
  const second=setup();
  await assert.rejects(second.repository.invitePair({mentorId:menteeId,menteeId:outsiderId},context),/named participant/);
  assert.equal(second.calls.some(call=>call[0]==='insert'),false);
});

test('lifecycle actions use only the bounded transition RPC',async()=>{
  const {repository,calls}=setup({rpcRow:pair({mentor_accepted_at:'2026-10-04T01:00:00Z'})});
  const result=await repository.transitionPair(pairId,' ACCEPT ',context);
  assert.equal(result.id,pairId);
  assert.deepEqual(calls.find(call=>call[0]==='rpc'),['rpc','bible_v7_transition_mentor_pair',{p_pair_id:pairId,p_action:'accept'}]);
  assert.equal(calls.some(call=>call[0]==='insert'),false);
});

test('unsupported lifecycle actions never reach the database',async()=>{
  const {repository,calls}=setup();
  await assert.rejects(repository.transitionPair(pairId,'suspend',context),/Unsupported/);
  assert.equal(calls.length,0);
});

test('lifecycle responses are rejected if account or congregation scope changes',async()=>{
  const foreign=setup({rpcRow:pair({congregation_id:outsiderId})});
  await assert.rejects(foreign.repository.transitionPair(pairId,'accept',context),/outside the active account or congregation/);
  const changed=setup({account:outsiderId});
  await assert.rejects(changed.repository.transitionPair(pairId,'end',context),/account changed/);
  assert.equal(changed.calls.some(call=>call[0]==='rpc'),false);
});

test('database lifecycle failures propagate without a client-side fallback write',async()=>{
  const denied=Object.assign(new Error('Only pair participants can change a V7 mentor pair'),{code:'42501'});
  const {repository,calls}=setup({rpcError:denied});
  await assert.rejects(repository.transitionPair(pairId,'end',context),/Only pair participants/);
  assert.equal(calls.filter(call=>call[0]==='rpc').length,1);
  assert.equal(calls.some(call=>call[0]==='insert'),false);
});

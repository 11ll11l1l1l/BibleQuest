import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiscipleshipService } from '../../src/app/discipleship.js';
import { createDiscipleshipPairRepository } from '../../src/app/discipleship-pair-repository.js';
import { createPairingController } from '../../src/features/pairing/controller.js';
import { renderPairing } from '../../src/features/pairing/index.js';
const actor='00000000-0000-4000-8000-000000000001',tenant='00000000-0000-4000-8000-000000000002',other='00000000-0000-4000-8000-000000000003',invitationId='00000000-0000-4000-8000-000000000004';
const stamp='2026-10-05T09:00:00Z',request={otherUserId:other,role:'mentor',invitationId};
const raw=()=>({id:invitationId,congregation_id:tenant,mentor_id:actor,mentee_id:other,initiated_by:actor,state:'invited'});
function fixture(){
  const context={actor,tenant,role:'leader'},calls=[],transport=Object.assign(new Error('Response lost'),{code:'FETCH_ERROR'});
  let saved=null;
  const repository={async invitePair(input,scope){calls.push(['insert',input,scope]);saved={...raw(),id:input.invitationId};throw transport;},async getPair(id,scope){calls.push(['read',id,scope]);return saved;}};
  const service=createDiscipleshipService({repository,session:{getState:()=>({authenticated:true,user:{id:context.actor}})},membership:{getActive:()=>({userId:context.actor,congregationId:context.tenant,role:context.role})}});
  return {service,repository,context,calls,transport,setSaved:row=>saved=row};
}
test('lost invitation receipt recovers only the exact committed request through scoped reads',async()=>{
  const f=fixture(),pair=await f.service.invitePair(request);
  assert.equal(pair.id,invitationId);assert.equal(pair.state,'invited');
  assert.deepEqual(f.calls.map(c=>c[0]),['insert','read']);
  assert.deepEqual(f.calls[0][1],{mentorId:actor,menteeId:other,invitationId});
  assert.deepEqual(f.calls[1].slice(1),[invitationId,{userId:actor,congregationId:tenant}]);
  f.repository.invitePair=async()=>{throw Object.assign(new Error('Already exists'),{code:'23505'});};
  f.setSaved({...raw(),state:'active',mentor_accepted_at:stamp,mentee_accepted_at:stamp});
  assert.equal((await f.service.invitePair(request)).state,'active');
  f.setSaved({...raw(),state:'ended',ended_at:stamp});assert.equal((await f.service.invitePair(request)).state,'ended');
});
test('recovery denies changed identity, participant direction, tenant, initiator and incomplete lifecycle',async()=>{
  const f=fixture();f.repository.invitePair=async()=>{throw f.transport;};
  for(const patch of [{id:other},{mentor_id:other,mentee_id:actor},{congregation_id:other},{initiated_by:other},{state:'active'},{state:'ended',ended_at:'bad'}]){
    f.setSaved({...raw(),...patch});await assert.rejects(f.service.invitePair(request),{code:'BQ_DISCIPLESHIP_PAIR_RESPONSE'});
  }
  f.context.role='member';await assert.rejects(f.service.invitePair(request),{code:'BQ_DISCIPLESHIP_INVITE_DENIED'});
  const g=fixture();await assert.rejects(g.service.invitePair({...request,invitationId:'invalid'}),{code:'BQ_DISCIPLESHIP_INVITE_INVALID'});assert.equal(g.calls.length,0);
});
test('uncommitted or unreadable attempts preserve failure and cannot fabricate success',async()=>{
  const f=fixture();f.repository.invitePair=async()=>{throw f.transport;};
  await assert.rejects(f.service.invitePair(request),error=>error===f.transport);
  f.repository.getPair=async()=>{throw new Error('RLS read denied');};
  await assert.rejects(f.service.invitePair(request),error=>error===f.transport);
  await assert.rejects(f.service.invitePair({otherUserId:other,role:'mentor'}),error=>error===f.transport);
});
test('account and congregation changes suppress recovery before and after the read',async()=>{
  const f=fixture();f.repository.invitePair=async()=>{f.context.tenant=other;throw f.transport;};
  await assert.rejects(f.service.invitePair(request),{code:'BQ_DISCIPLESHIP_CONTEXT_STALE'});assert.equal(f.calls.length,0);
  const g=fixture();g.repository.getPair=async()=>{g.context.actor=other;return raw();};
  await assert.rejects(g.service.invitePair(request),{code:'BQ_DISCIPLESHIP_CONTEXT_STALE'});
});
test('repository pins insert identity without accepting authority or lifecycle columns',async()=>{
  const writes=[];let clients=0;
  const q={insert:value=>{writes.push(value);return q;},select:()=>q,single:async()=>({data:raw()})};
  const repository=createDiscipleshipPairRepository(async()=>{clients++;return {auth:{getUser:async()=>({data:{user:{id:actor}}})},from:()=>q};});
  await repository.invitePair({mentorId:actor,menteeId:other,invitationId,congregationId:other,state:'active',mentor_accepted_at:stamp},{userId:actor,congregationId:tenant});
  assert.deepEqual(writes[0],{id:invitationId,congregation_id:tenant,mentor_id:actor,mentee_id:other,initiated_by:actor,state:'invited'});
  await assert.rejects(repository.invitePair({mentorId:actor,menteeId:other,invitationId:'bad'},{userId:actor,congregationId:tenant}));assert.equal(clients,1);
});
test('controller keeps retry identity across errors and reload, changes it for new choices or scope',async()=>{
  let ids=0;const calls=[];
  const controller=createPairingController({service:{listPairCandidates:async()=>[{userId:other,displayName:'Member'}],invitePair:async input=>{calls.push(input);throw new Error('Offline');}},getActorId:()=>actor,createInvitationId:()=>`request-${++ids}`});
  await controller.load();await controller.invite(request);await controller.load();await controller.invite(request);
  assert.equal(calls[0].invitationId,calls[1].invitationId);assert.equal(ids,1);
  assert.deepEqual(controller.getState().invitationDraft,{otherUserId:other,role:'mentor'});
  await controller.invite({...request,role:'mentee'});assert.equal(ids,2);
  controller.invalidate();assert.equal(controller.getState().invitationDraft,null);
  await controller.load();await controller.invite({...request,role:'mentee'});assert.equal(ids,3);controller.dispose();
});
test('overlapping invitation clicks do not replace the pending identity or draft',async()=>{
  let resolve;const calls=[];
  const controller=createPairingController({service:{invitePair:input=>{calls.push(input);return new Promise(r=>resolve=r);}},getActorId:()=>actor,createInvitationId:()=>invitationId});
  const pending=controller.invite(request);await controller.invite({...request,role:'mentee'});
  assert.equal(calls.length,1);assert.equal(controller.getState().invitationDraft.role,'mentor');
  controller.invalidate();resolve({id:invitationId,state:'invited'});await pending;assert.equal(controller.getState().pair,null);controller.dispose();
});
test('failed invitation retains escaped member and role selections for retry',()=>{
  const html=renderPairing({status:'error',error:'v7.pairing.error',candidates:[{userId:other,displayName:'<bad>'}],invitationDraft:{otherUserId:other,role:'mentee'}});
  assert.match(html,new RegExp(`value="${other}" selected`));assert.match(html,/value="mentee" selected/);assert.match(html,/data-pair-invite/);assert.match(html,/&lt;bad&gt;/);assert.doesNotMatch(html,/<bad>/);
});

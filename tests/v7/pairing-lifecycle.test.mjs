import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiscipleshipService } from '../../src/app/discipleship.js';
import { createDiscipleshipPairRepository } from '../../src/app/discipleship-pair-repository.js';
import { createPairingController } from '../../src/features/pairing/controller.js';
import { renderPairing, pairingPage } from '../../src/features/pairing/index.js';
import { localization } from '../../src/app/localization.js';
const user='00000000-0000-4000-8000-000000000001', church='00000000-0000-4000-8000-000000000002', other='00000000-0000-4000-8000-000000000003', id='00000000-0000-4000-8000-000000000004';
const stamp='2026-10-05T06:00:00Z';
const raw = () => ({id,congregation_id:church,mentor_id:user,mentee_id:other,state:'invited'});
function fixture({role='leader',row=raw()}={}) {
  let actor=user,scope=church, current=row;
  const calls=[];
  const repository={ async getPair(){return current;}, async listPairCandidates(){return [{user_id:other,display_name:'Other member',congregation_id:church,active:true}];},
    async invitePair(input,context){calls.push({input,context});return {...raw(),mentor_id:input.mentorId,mentee_id:input.menteeId};},
    async transitionPair(pairId,action,context){calls.push({pairId,action,context});return {...current,state:action==='decline'?'declined':action==='end'?'ended':'invited',mentor_accepted_at:action==='accept'?stamp:null,ended_at:action==='accept'?null:stamp};},};
  const session={getState:()=>({authenticated:Boolean(actor),user:{id:actor}})},membership={getActive:()=>({userId:actor,congregationId:scope,role})};
  return {service:createDiscipleshipService({repository,session,membership}),repository,calls,setActor:v=>actor=v,setScope:v=>scope=v,setRow:v=>current=v};
}
test('invitation derives self identity and active congregation and returns only verified acknowledgement',async()=>{
  const f=fixture();
  assert.equal((await f.service.listPairCandidates())[0].displayName,'Other member');
  const pair=await f.service.invitePair({otherUserId:other,role:'mentor',congregationId:'ignored',mentorId:'ignored'});
  assert.equal(pair.state,'invited'); assert.deepEqual(f.calls[0].input,{mentorId:user,menteeId:other});
  assert.equal(f.calls[0].context.congregationId,church);
  f.repository.invitePair=async()=>({...raw(),mentor_accepted_at:stamp});
  await assert.rejects(f.service.invitePair({otherUserId:other,role:'mentor'}),{code:'BQ_DISCIPLESHIP_PAIR_RESPONSE'});
});
test('invitation denies ordinary members, self-pairing, invalid roles and malformed candidate scope',async()=>{
  const f=fixture({role:'member'});
  await assert.rejects(f.service.invitePair({otherUserId:other,role:'mentor'}),{code:'BQ_DISCIPLESHIP_INVITE_DENIED'});
  await assert.rejects(f.service.listPairCandidates(),{code:'BQ_DISCIPLESHIP_INVITE_DENIED'});
  assert.equal(f.calls.length,0);
  const g=fixture();
  await assert.rejects(g.service.invitePair({otherUserId:user,role:'mentor'}),{code:'BQ_DISCIPLESHIP_INVITE_INVALID'});
  await assert.rejects(g.service.invitePair({otherUserId:other,role:'admin'}),{code:'BQ_DISCIPLESHIP_INVITE_INVALID'});
  g.repository.listPairCandidates=async()=>[{user_id:other,congregation_id:other,active:true}];
  await assert.rejects(g.service.listPairCandidates(),{code:'BQ_DISCIPLESHIP_PAIR_RESPONSE'});
});
test('pair actions accept, decline and end with explicit ending confirmation and exact identity validation',async()=>{
  const f=fixture();
  assert.equal((await f.service.transitionPair(id,'accept')).mentorAcceptedAt,stamp);
  assert.equal((await f.service.transitionPair(id,'decline')).state,'declined');
  await assert.rejects(f.service.transitionPair(id,'end'),{code:'BQ_DISCIPLESHIP_PAIR_ACTION'});
  f.setRow({...raw(),state:'active',mentor_accepted_at:stamp,mentee_accepted_at:stamp});
  assert.equal((await f.service.transitionPair(id,'end',{confirmed:true})).state,'ended');
  f.repository.transitionPair=async()=>({...raw(),id:other,state:'ended',ended_at:stamp});
  await assert.rejects(f.service.transitionPair(id,'end',{confirmed:true}),{code:'BQ_DISCIPLESHIP_PAIR_RESPONSE'});
});
test('pair actions deny nonparticipant, cross-congregation and stale account acknowledgements',async()=>{
  const f=fixture(); f.setActor(church);
  await assert.rejects(f.service.getPair(id),{code:'BQ_DISCIPLESHIP_PAIR_DENIED'});
  f.setActor(user);f.setScope(other);
  await assert.rejects(f.service.transitionPair(id,'accept'),{code:'BQ_DISCIPLESHIP_PAIR_RESPONSE'});
  f.setScope(church);
  f.repository.transitionPair=async()=>{f.setActor(other);return {...raw(),mentor_accepted_at:stamp};};
  await assert.rejects(f.service.transitionPair(id,'accept'),{code:'BQ_DISCIPLESHIP_CONTEXT_STALE'});
});
test('pair repository writes only invitation columns and uses the existing lifecycle RPC',async()=>{
  const calls=[];
  const q={insert(value){calls.push(['insert',value]);return q;},select(){return q;},single:async()=>({data:raw()})};
  const repo=createDiscipleshipPairRepository(async()=>({auth:{getUser:async()=>({data:{user:{id:user}}})},from(table){calls.push(['from',table]);return q;},rpc:async(name,args)=>{calls.push(['rpc',name,args]);return {data:[{...raw(),mentor_accepted_at:stamp}]};}}));
  const context={userId:user,congregationId:church};
  await repo.invitePair({mentorId:user,menteeId:other,mentor_accepted_at:stamp},context);
  assert.deepEqual(calls.find(c=>c[0]==='insert')[1],{congregation_id:church,mentor_id:user,mentee_id:other,initiated_by:user,state:'invited'});
  await repo.transitionPair(id,'accept',context);
  assert.deepEqual(calls.at(-1),['rpc','bible_v7_transition_mentor_pair',{p_pair_id:id,p_action:'accept'}]);
  await assert.rejects(repo.transitionPair(id,'suspend',context));
});
test('pair controller blocks duplicate actions and suppresses late writes after context reset or disposal',async()=>{
  let done, writes=0;
  const pair={id,mentorId:user,menteeId:other,state:'invited'};
  const service={getPair:async()=>pair,transitionPair:()=>{writes++;return new Promise(r=>done=r);}};
  const controller=createPairingController({service,pairId:id,getActorId:()=>user});
  await controller.load();const pending=controller.act('accept');await controller.act('accept');assert.equal(writes,1);
  controller.invalidate();done({...pair,mentorAcceptedAt:stamp});await pending;
  assert.equal(controller.getState().pair,null);assert.equal(controller.getState().status,'idle');
  await controller.load();const late=controller.act('accept');controller.dispose();done(pair);await late;assert.equal(controller.getState().pair,null);
});
test('pairing display escapes member names and requires explicit end intent without exposing terminal actions',()=>{
  const html=renderPairing({status:'ready',candidates:[{userId:other,displayName:'<img onerror=bad>'}]});
  assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);
  const active=renderPairing({status:'ready',actorId:user,pair:{id,state:'active'}});assert.match(active,/data-pair-end-confirm/);
  const ended=renderPairing({status:'ready',pair:{id,state:'ended'}});assert.doesNotMatch(ended,/data-pair-action="accept|data-pair-action="end|data-pair-action="lessons/);
  for(const locale of ['en','tl','ceb'])assert.notEqual(localization.t('v7.pairing.accept',{locale}),'v7.pairing.accept');
});
test('pairing page routes actual actions, reloads hydrated context and disposes listeners',async()=>{
  let contextListener,ended=0,lessons=0,accepted=0;
  const pair={id,mentorId:user,menteeId:other,state:'invited'},events={},host={innerHTML:''},checkbox={checked:false};
  const root={querySelector:key=>key==='[data-pairing]'?host:checkbox,addEventListener:(name,fn)=>events[name]=fn,removeEventListener:name=>delete events[name]};
  const service={getPair:async()=>pair,transitionPair:async(_id,action,options)=>{if(action==='accept')accepted++;if(action==='end'){assert.equal(options.confirmed,true);ended++;}return {...pair,state:action==='end'?'ended':'active'};}};
  const page=pairingPage({service,session:{getState:()=>({user:{id:user}})},pairId:id,isContextReady:()=>true,subscribeContext:fn=>{contextListener=fn;return()=>contextListener=null;},onBack:()=>{},onAccount:()=>{},onCongregation:()=>{},onLessons:()=>lessons++});
  const cleanup=page.mount(root),flush=()=>new Promise(resolve=>setImmediate(resolve));await flush();
  const click=action=>events.click({target:{closest:()=>({disabled:false,getAttribute:key=>key==='data-pair-action'?action:null})}});
  click('accept');await flush();assert.equal(accepted,1);click('lessons');assert.equal(lessons,1);
  checkbox.checked=true;click('end');await flush();assert.equal(ended,1);assert.doesNotMatch(host.innerHTML,/data-pair-action="end"/);
  contextListener();await flush();assert.match(host.innerHTML,/data-pair-action="accept"/);
  cleanup();assert.equal(contextListener,null);assert.equal(Object.keys(events).length,0);
});
test('controller clears a late account acknowledgement even without context notification',async()=>{
  let actor=user,resolve;
  const controller=createPairingController({service:{getPair:()=>new Promise(r=>resolve=r)},pairId:id,getActorId:()=>actor});
  const pending=controller.load();actor=other;resolve({id,state:'active'});await pending;
  assert.equal(controller.getState().pair,null);assert.equal(controller.getState().status,'idle');controller.dispose();
});

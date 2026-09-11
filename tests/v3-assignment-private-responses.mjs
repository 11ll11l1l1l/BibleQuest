import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createAssignmentsService} from '../src/app/assignments.js';

const assignmentRow={
  id:'a-1',congregation_id:'c-1',created_by:'pastor-1',title:'Weekly reflection',instructions:'What stood out to you?',assignment_type:'reflection',scripture_refs:['John 1'],target_scope:'all',target_id:null,due_at:null,points:5,active:true,created_at:'2026-09-11T00:00:00Z',updated_at:'2026-09-11T00:00:00Z',schedule_at:null,recurrence_rule:null,reminder_at:null,required_reflection:true,min_quiz_score:null,evidence_type:'none'
};

function fakeSession(userId){return {getState:()=>({authenticated:true,remoteAvailable:true,user:{id:userId}})}}
function fakeCongregation(role){return {load:async()=>[{congregationId:'c-1',role,roleLabel:role,congregation:{name:'Test Church'}}],assert:()=>true}}
function fakeApi(userId){return {
  load:async()=>({assignments:[assignmentRow],progress:[]}),
  start:async()=>({progress:{assignment_id:'a-1',user_id:userId,status:'started'},awarded:0}),
  complete:async()=>({progress:{assignment_id:'a-1',user_id:userId,status:'completed'},awarded:5}),
  subscribe:async()=>()=>{}
}}

{
  let privateReads=0;
  const responseApi={
    loadPresence:async()=>[{assignment_id:'a-1',congregation_id:'c-1',user_id:'member-2',display_name:'Ana',completed_at:'2026-09-11T03:00:00Z'}],
    loadPrivateResponses:async()=>{privateReads++;return[{assignment_id:'a-1',user_id:'member-2',status:'completed',submission:'PRIVATE ANSWER',leader_feedback:null,completed_at:'2026-09-11T03:00:00Z',updated_at:'2026-09-11T03:00:00Z'}]}
  };
  const service=createAssignmentsService({api:fakeApi('member-1'),responseApi,session:fakeSession('member-1'),congregation:fakeCongregation('member')});
  await service.load();
  service.open('a-1');
  const state=await service.loadReview('a-1');
  assert.equal(privateReads,0,'ordinary members must never request private answer rows');
  assert.equal(state.activeReview.responders.length,1);
  assert.equal(state.activeReview.responders[0].displayName,'Ana');
  assert.deepEqual(state.activeReview.responses,[],'ordinary-member state must contain no peer answer bodies');
  assert.equal(JSON.stringify(state.activeReview).includes('PRIVATE ANSWER'),false);
}

{
  let privateReads=0;
  const responseApi={
    loadPresence:async()=>[{assignment_id:'a-1',congregation_id:'c-1',user_id:'member-2',display_name:'Ana',completed_at:'2026-09-11T03:00:00Z'}],
    loadPrivateResponses:async()=>{privateReads++;return[{assignment_id:'a-1',user_id:'member-2',status:'completed',submission:'PRIVATE ANSWER',leader_feedback:'Thanks',completed_at:'2026-09-11T03:00:00Z',updated_at:'2026-09-11T03:00:00Z'}]}
  };
  const service=createAssignmentsService({api:fakeApi('pastor-1'),responseApi,session:fakeSession('pastor-1'),congregation:fakeCongregation('pastor')});
  await service.load();
  service.open('a-1');
  const state=await service.loadReview('a-1');
  assert.equal(privateReads,1,'pastor/ministry review must request private answer rows');
  assert.equal(state.activeReview.responders[0].displayName,'Ana');
  assert.equal(state.activeReview.responses[0].displayName,'Ana');
  assert.equal(state.activeReview.responses[0].submission,'PRIVATE ANSWER');
}

{
  const migration=fs.readFileSync(new URL('../supabase/migrations/20260911131000_assignment_response_presence.sql',import.meta.url),'utf8');
  const tableBody=migration.match(/create table if not exists public\.bible_assignment_response_presence \(([\s\S]*?)\n\);/i)?.[1]||'';
  assert.ok(tableBody.includes('display_name text'));
  assert.ok(tableBody.includes('completed_at timestamptz'));
  assert.equal(/submission|leader_feedback/i.test(tableBody),false,'peer-visible projection must never store private response text or feedback');
  assert.match(migration,/revoke insert, update, delete .* from authenticated/i);
  assert.match(migration,/grant select .* to authenticated/i);
  assert.match(migration,/private\.bible_assignment_visible\(a\.congregation_id, a\.target_scope, a\.target_id\)/);
  assert.match(migration,/create or replace function private\.bible_sync_assignment_response_presence\(\)/i);
  assert.match(migration,/security definer\s+set search_path = ''/i);
  assert.match(migration,/revoke all on function private\.bible_sync_assignment_response_presence\(\) from authenticated/i);
  assert.match(migration,/execute function private\.bible_sync_assignment_response_presence\(\)/i);
  assert.equal(/create or replace function public\.bible_sync_assignment_response_presence/i.test(migration),false,'SECURITY DEFINER trigger function must not live in the exposed public schema');
}

console.log('assignment private response contract: ok');

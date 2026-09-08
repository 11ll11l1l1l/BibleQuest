import { createCongregationMembershipService } from '../src/app/congregation-membership.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const USER='11111111-1111-4111-8111-111111111111';
const OTHER='22222222-2222-4222-8222-222222222222';
const sessionState={authenticated:true,user:{id:USER,email:'mark@example.com'}};
const session={getState:()=>sessionState};
let joinedCode='';
let rows=[
  {congregation_id:'c-member',user_id:USER,role:'member',display_name:'Mark',active:true,joined_at:'2026-09-08T00:00:00Z',congregation:{id:'c-member',name:'Member Church',timezone:'Asia/Tokyo',owner_id:OTHER}},
  {congregation_id:'c-pastor',user_id:USER,role:'pastor',display_name:'Mark',active:true,joined_at:'2026-09-08T00:00:00Z',congregation:{id:'c-pastor',name:'Pastor Church',timezone:'Asia/Tokyo',owner_id:OTHER}},
  {congregation_id:'c-weird',user_id:USER,role:'owner',display_name:'Mark',active:true,joined_at:'2026-09-08T00:00:00Z',congregation:{id:'c-weird',name:'Wrong Role Church',timezone:'Asia/Tokyo',owner_id:OTHER}},
  {congregation_id:'c-other',user_id:OTHER,role:'admin',display_name:'Other',active:true,joined_at:'2026-09-08T00:00:00Z',congregation:{id:'c-other',name:'Other Church',timezone:'Asia/Tokyo',owner_id:OTHER}}
];
const api={congregation:{
  async listMemberships(userId){assert(userId===USER,'Membership read must be scoped to the authenticated user.');return rows;},
  async join(code){joinedCode=code;rows=[...rows,{congregation_id:'c-joined',user_id:USER,role:'facilitator',display_name:'Mark',active:true,joined_at:'2026-09-08T01:00:00Z',congregation:{id:'c-joined',name:'Joined Church',timezone:'Asia/Tokyo',owner_id:OTHER}}];return {role:'facilitator'};}
}};
const membership=createCongregationMembershipService({api,session});

const loaded=await membership.load();
assert(loaded.length===3,'Membership owner must drop rows belonging to another user.');
assert(membership.get('c-member').roleLabel==='Member','Member role label was not recovered.');
assert(membership.get('c-pastor').roleLabel==='Pastor','Pastor role must remain a congregation role.');
assert(membership.get('c-weird').role===null&&!membership.get('c-weird').roleKnown,'Platform/unknown roles must fail closed in congregation membership.');
assert(membership.can('c-member','read'),'Active member must have congregation read capability.');
assert(!membership.can('c-member','ministry'),'Member must not receive leadership capability.');
assert(membership.can('c-pastor','ministry'),'Pastor must receive recovered ministry capability.');
assert(!membership.can('c-pastor','admin'),'Pastor must not be silently elevated to congregation Admin.');
assert(!membership.can('c-weird','read')&&!membership.can('c-weird','ministry')&&!membership.can('c-weird','admin'),'Unknown roles must receive no client capability.');
let denied='';try{membership.assert('c-member','ministry')}catch(error){denied=error.code}assert(denied==='BQ_CONGREGATION_PERMISSION_DENIED','Denied capability must fail explicitly.');

let invalid='';try{await membership.join(' - ')}catch(error){invalid=error.code}assert(invalid==='BQ_CONGREGATION_INVITE_INVALID','Invalid invite codes must be rejected before remote join.');
const afterJoin=await membership.join(' ab-cd 23 ');assert(joinedCode==='ABCD23','Invite code normalization must be deterministic.');assert(afterJoin.some(row=>row.congregationId==='c-joined'&&row.role==='facilitator'),'Successful join must reload server-backed membership rather than inventing a local role.');assert(membership.can('c-joined','ministry'),'Facilitator must receive recovered ministry capability.');

sessionState.authenticated=false;sessionState.user=null;
let authLoad='';try{await membership.load()}catch(error){authLoad=error.code}assert(authLoad==='BQ_CONGREGATION_AUTH_REQUIRED','Signed-out membership reads must be rejected.');
let authJoin='';try{await membership.join('ABCDE')}catch(error){authJoin=error.code}assert(authJoin==='BQ_CONGREGATION_AUTH_REQUIRED','Signed-out joins must be rejected.');
membership.clear();assert(membership.list().length===0,'Membership clear must discard the in-memory cache.');
let boundary='';try{createCongregationMembershipService({api:null,session})}catch(error){boundary=error.message}assert(/shared API and session/i.test(boundary),'Membership owner must require centralized API/session boundaries.');

console.log('BibleQuest v3 congregation membership edge regression passed.');

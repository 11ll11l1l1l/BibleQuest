import {createCouplesCloudService} from '../src/app/couples-cloud.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const now='2026-09-08T12:00:00.000Z';
const user={id:'user-a',email:'a@example.test'};
const sessionState={authenticated:true,remoteAvailable:true,user};
const session={getState:()=>sessionState};
let pair={id:'pair-1',user_a:'user-a',user_b:'user-b',status:'active',created_at:now,updated_at:now};
let shared=[
  {id:'s1',pair_id:'pair-1',author_id:'user-b',item_type:'journey',body:'1|Pray Honestly',created_at:now,updated_at:now},
  {id:'s2',pair_id:'pair-1',author_id:'user-b',item_type:'challenge',body:'challenge:3|Couples Challenge',created_at:now,updated_at:now}
];
let calls=[];
const api={
  async status(){calls.push(['status']);return{pair}},
  async create(){calls.push(['create']);return{pair:{id:'pair-2',user_a:'user-a',user_b:null,status:'pending',created_at:now,updated_at:now},inviteCode:'ABCD2345'}},
  async join(code){calls.push(['join',code]);return{pair:{id:'pair-3',user_a:'user-b',user_b:'user-a',status:'active',created_at:now,updated_at:now}}},
  async leave(pairId){calls.push(['leave',pairId]);return{ok:true}},
  async listShared(pairId){calls.push(['listShared',pairId]);return shared.filter(row=>row.pair_id===pairId)},
  async addShared(rows){calls.push(['addShared',rows]);for(const row of rows)shared.push({id:`s${shared.length+1}`,...row,created_at:now,updated_at:now});return rows}
};

const service=createCouplesCloudService({api,session});
let state=await service.load();
assert(state.pair?.id==='pair-1'&&state.shared.length===2,'Active pair/shared history failed to load.');
assert(state.shared.some(item=>item.itemType==='challenge'),'Pair-linked challenge history was lost.');

await service.completeJourney(2,'Listen First','We will paraphrase before advice.');
state=service.snapshot();
assert(state.shared.filter(item=>item.itemType==='journey'&&item.body==='2|Listen First').length===1,'Journey completion was not appended once.');
assert(state.shared.some(item=>item.itemType==='commitment'&&item.body==='We will paraphrase before advice.'),'Optional shared commitment was not appended.');
const writesBefore=calls.filter(call=>call[0]==='addShared').length;
await service.completeJourney(2,'Listen First','');
assert(calls.filter(call=>call[0]==='addShared').length===writesBefore,'Duplicate synchronized journey completion appended another row.');

pair={id:'pair-2',user_a:'user-a',user_b:null,status:'pending',created_at:now,updated_at:now};
state=await service.createPair();
assert(state.pair.status==='pending'&&state.inviteCode==='ABCD2345','Pending pair code creation failed.');
let invalid=false;try{await service.join('short')}catch(error){invalid=error.code==='BQ_COUPLES_CLOUD_CODE'}assert(invalid,'Invalid pair code must fail before API join.');
shared=[];state=await service.join('ZXCV6789');assert(state.pair.status==='active'&&state.pair.userB==='user-a','Valid pair join did not activate the user pair.');

await service.leave();state=service.snapshot();assert(state.pair===null&&state.shared.length===0&&state.inviteCode==='','Unlink did not clear in-memory pair state.');assert(calls.some(call=>call[0]==='leave'&&call[1]==='pair-3'),'Unlink did not call trusted leave action.');

sessionState.authenticated=false;let authFailed=false;try{await service.load()}catch(error){authFailed=error.code==='BQ_COUPLES_CLOUD_AUTH_REQUIRED'}assert(authFailed,'Signed-out Couples cloud must fail closed.');
sessionState.authenticated=true;sessionState.remoteAvailable=false;let previewFailed=false;try{await service.load()}catch(error){previewFailed=error.code==='BQ_COUPLES_CLOUD_REMOTE_DISABLED'}assert(previewFailed,'Local-preview Couples cloud must fail closed.');
sessionState.remoteAvailable=true;

pair={id:'foreign-pair',user_a:'other-a',user_b:'other-b',status:'active',created_at:now,updated_at:now};let foreignPair=false;try{await service.load()}catch(error){foreignPair=error.code==='BQ_COUPLES_CLOUD_PERMISSION'}assert(foreignPair,'Foreign pair membership must be rejected.');
pair={id:'pair-1',user_a:'user-a',user_b:'user-b',status:'active',created_at:now,updated_at:now};shared=[{id:'bad',pair_id:'other-pair',author_id:'user-b',item_type:'journey',body:'1|Pray Honestly',created_at:now,updated_at:now}];let foreignRow=false;try{await service.load()}catch(error){foreignRow=error.code==='BQ_COUPLES_CLOUD_MALFORMED'}assert(foreignRow,'Foreign/malformed shared rows must be rejected.');

console.log('BibleQuest v3 Couples cloud edge regression passed.');

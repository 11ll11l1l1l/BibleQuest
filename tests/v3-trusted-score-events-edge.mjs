import {createTrustedScoreEventsService,SCORE_EVENT_BATCH_MAX,SCORE_EVENT_ID_MAX} from '../src/app/trusted-score-events.js';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
let sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}};
const session={getState:()=>sessionState};
let memberships=[{congregationId:'c1',userId:'u1'}];
const congregation={
  can(id,cap){return cap==='read'&&memberships.some(row=>row.congregationId===String(id)&&row.userId==='u1')},
  async load(){return memberships.slice()}
};
const calls=[];
let responder=async(congregationId,claims)=>({processed:claims.map(claim=>({sourceEventId:claim.sourceEventId,accepted:true,points:5,category:'reading',targetUserId:'u1'}))});
const api={async submit(congregationId,claims){calls.push([congregationId,claims]);return responder(congregationId,claims)}};
const service=createTrustedScoreEventsService({api,session,congregation});

const longId=`  ${'x'.repeat(SCORE_EVENT_ID_MAX+20)}  `;
let result=await service.submit(' c1 ',[{sourceEventId:longId,source:'Guided Study',meta:{completed:1}}]);
assert(result.accepted===1&&result.rejected===0&&result.duplicates===0,'Accepted trusted-score result counters failed.');
assert(calls[0][0]==='c1','Congregation ID was not normalized before trusted submission.');
assert(calls[0][1][0].sourceEventId.length===SCORE_EVENT_ID_MAX&&!calls[0][1][0].sourceEventId.includes(' '),'Stable event ID canonicalization failed.');
assert(calls[0][1][0].source==='Guided Study'&&calls[0][1][0].meta.completed===1,'Activity claim must be forwarded without browser point derivation.');

const beforeDuplicate=calls.length;
let localDuplicate=false;try{await service.submit('c1',[{sourceEventId:'same',source:'Guided Study'},{sourceEventId:' same ',source:'Guided Study'}])}catch(error){localDuplicate=error.code==='BQ_SCORE_EVENT_DUPLICATE'}
assert(localDuplicate&&calls.length===beforeDuplicate,'Canonical duplicates in one submission must fail before mutation.');

responder=async(_congregationId,claims)=>({processed:[{sourceEventId:claims[0].sourceEventId,accepted:false,duplicate:true}]});
result=await service.submit('c1',[{sourceEventId:'existing-1',source:'Guided Study',meta:{completed:1}}]);
assert(result.accepted===0&&result.duplicates===1&&result.rejected===0&&result.processed[0].duplicate===true,'Trusted server duplicate rejection must remain a duplicate, not success.');

responder=async(_congregationId,claims)=>({processed:[{sourceEventId:claims[0].sourceEventId,accepted:false,reason:'unsupported_or_mismatched_activity'}]});
result=await service.submit('c1',[{sourceEventId:'unsupported-1',source:'Unknown Activity'}]);
assert(result.rejected===1&&result.accepted===0&&result.processed[0].reason==='unsupported_or_mismatched_activity','Trusted server activity rejection was not preserved.');

let invalid=false;try{await service.submit('c1',[{sourceEventId:'',source:'Guided Study'}])}catch(error){invalid=error.code==='BQ_SCORE_EVENT_INVALID'}assert(invalid,'Missing stable event ID must fail closed.');
invalid=false;try{await service.submit('c1',[{sourceEventId:'id',source:''}])}catch(error){invalid=error.code==='BQ_SCORE_EVENT_INVALID'}assert(invalid,'Missing source must fail closed.');
invalid=false;try{await service.submit('c1',[{sourceEventId:'id',source:'Guided Study',meta:[]}])}catch(error){invalid=error.code==='BQ_SCORE_EVENT_INVALID'}assert(invalid,'Array metadata must fail closed.');
invalid=false;try{await service.submit('c1',Array.from({length:SCORE_EVENT_BATCH_MAX+1},(_,index)=>({sourceEventId:`id-${index}`,source:'Guided Study'})))}catch(error){invalid=error.code==='BQ_SCORE_EVENT_INVALID'}assert(invalid,'Oversized score-event batch must fail closed.');

sessionState={authenticated:false,remoteAvailable:true,user:null};let auth=false;try{await service.submit('c1',[{sourceEventId:'auth',source:'Guided Study'}])}catch(error){auth=error.code==='BQ_SCORE_EVENT_AUTH_REQUIRED'}assert(auth,'Signed-out score submission must fail closed.');
sessionState={authenticated:true,remoteAvailable:false,user:{id:'u1'}};let preview=false;try{await service.submit('c1',[{sourceEventId:'preview',source:'Guided Study'}])}catch(error){preview=error.code==='BQ_SCORE_EVENT_REMOTE_DISABLED'}assert(preview,'Local-preview score submission must fail closed.');
sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}};memberships=[];let scope=false;try{await service.submit('c9',[{sourceEventId:'foreign',source:'Guided Study'}])}catch(error){scope=error.code==='BQ_SCORE_EVENT_SCOPE'}assert(scope,'Foreign congregation score submission must fail closed.');
memberships=[{congregationId:'c1',userId:'u1'}];

responder=async()=>({processed:[{sourceEventId:'unexpected',accepted:true,points:5}]});let response=false;try{await service.submit('c1',[{sourceEventId:'expected',source:'Guided Study'}])}catch(error){response=error.code==='BQ_SCORE_EVENT_RESPONSE'}assert(response,'Unexpected trusted response IDs must fail closed.');
responder=async(_id,claims)=>({processed:[{sourceEventId:claims[0].sourceEventId,accepted:true,duplicate:true,points:5}]});response=false;try{await service.submit('c1',[{sourceEventId:'contradictory',source:'Guided Study'}])}catch(error){response=error.code==='BQ_SCORE_EVENT_RESPONSE'}assert(response,'Contradictory accepted/duplicate server response must fail closed.');

assert(service.limits().eventIdMax===120&&service.limits().batchMax===50,'Retained score-event limits changed unexpectedly.');
console.log('BibleQuest v3 Trusted Score Events edge regression passed.');

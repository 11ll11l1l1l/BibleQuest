import {createPresenceService,isPresenceOnline,PRESENCE_HEARTBEAT_MS,PRESENCE_STALE_MS,PRESENCE_CLOCK_SKEW_MS} from '../src/app/presence.js';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
function makeStore(session){
  let state={session,presence:null};const listeners=new Set();
  return {getState:()=>state,setState(patch){state=typeof patch==='function'?patch(state):{...state,...patch};listeners.forEach(listener=>listener(state));return state},subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)}};
}

let now=Date.UTC(2026,8,9,12,0,0),sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}},memberships=[{congregationId:'c1',userId:'u1'}],loadCalls=0;
const store=makeStore(sessionState),touches=[],leaves=[],timers=new Map();let nextTimer=1;const activeCountCalls=[];let activeCountValue=3;
const api={
  async touch(congregationId,userId,surface){touches.push({congregationId,userId,surface});return {congregation_id:congregationId,user_id:userId,last_seen_at:new Date(now).toISOString(),surface}},
  async list(congregationId){return [
    {congregation_id:congregationId,user_id:'u1',last_seen_at:new Date(now-1000).toISOString(),surface:'BibleQuest'},
    {congregation_id:congregationId,user_id:'u2',last_seen_at:new Date(now-PRESENCE_STALE_MS-1).toISOString(),surface:'BibleQuest'}
  ]},
  async leave(congregationId,userId){leaves.push({congregationId,userId})},
  async activeCount(congregationId,windowMinutes){activeCountCalls.push({congregationId,windowMinutes});return activeCountValue}
};
const session={getState:()=>sessionState};
const congregation={
  list:()=>memberships.slice(),
  async load(){loadCalls+=1;memberships=sessionState.user?.id==='u2'?[{congregationId:'c2',userId:'u2'}]:[{congregationId:'c1',userId:'u1'}];return memberships.slice()},
  can(id,capability){return capability==='read'&&memberships.some(row=>row.congregationId===id&&row.userId===sessionState.user?.id)}
};
const service=createPresenceService({api,session,congregation,store,clock:()=>now,setIntervalFn(fn,ms){const id=nextTimer++;timers.set(id,{fn,ms});return id},clearIntervalFn:id=>timers.delete(id)});
let state=await service.start();
assert(state.status==='online'&&state.userId==='u1','Authenticated Presence did not become online.');
assert(touches.length===1&&touches[0].congregationId==='c1'&&touches[0].userId==='u1','Initial heartbeat did not touch the signed-in user row.');
assert(timers.size===1&&[...timers.values()][0].ms===PRESENCE_HEARTBEAT_MS,'Presence heartbeat timer drifted.');
let rows=await service.load('c1');
assert(rows.length===2&&rows[0].online===true&&rows[1].online===false,'Presence stale classification failed on loaded rows.');
now+=PRESENCE_STALE_MS+1;rows=service.snapshot('c1');assert(rows[0].online===false,'Cached Presence row did not age out at the stale timeout.');
assert(isPresenceOnline({lastSeenAt:new Date(now+PRESENCE_CLOCK_SKEW_MS).toISOString()},now),'Allowed clock skew should remain online.');
assert(!isPresenceOnline({lastSeenAt:new Date(now+PRESENCE_CLOCK_SKEW_MS+1).toISOString()},now),'Excessive future clock skew must fail closed.');

// A user switch may leave the congregation owner temporarily holding the previous user's cache.
// Presence must reload instead of treating the new user as having no congregation.
sessionState={authenticated:true,remoteAvailable:true,user:{id:'u2'}};store.setState(current=>({...current,session:sessionState}));await flush();await flush();
state=service.getState();
assert(loadCalls>=1,'Presence did not refresh congregation membership after an authenticated user switch.');
assert(state.status==='online'&&state.userId==='u2'&&state.congregationIds.join(',')==='c2','Presence did not reconcile to the new authenticated user.');
assert(touches.some(row=>row.congregationId==='c2'&&row.userId==='u2'),'Presence did not heartbeat the new user membership.');

const beforeLeaveTimerCount=timers.size;await service.leave();
assert(beforeLeaveTimerCount===1&&timers.size===0,'Presence leave did not clear its heartbeat timer.');
assert(leaves.some(row=>row.congregationId==='c2'&&row.userId==='u2'),'Presence leave did not delete the current user row.');
assert(service.getState().status==='offline','Presence leave did not publish offline state.');
await service.dispose();assert(timers.size===0,'Presence dispose must be idempotent and timer-free.');

let guestTouches=0;sessionState={authenticated:false,remoteAvailable:true,user:null};memberships=[];
const guestStore=makeStore(sessionState),guest=createPresenceService({api:{touch:async()=>{guestTouches+=1},list:async()=>[],leave:async()=>{},activeCount:async()=>0},session,congregation,store:guestStore,setIntervalFn(){throw new Error('Signed-out Presence must not schedule a heartbeat.')},clearIntervalFn(){}});
state=await guest.start();assert(state.status==='signed-out'&&guestTouches===0,'Signed-out Presence must not write cloud state.');await guest.dispose({remove:false});

sessionState={authenticated:true,remoteAvailable:false,user:{id:'u1'}};
const previewStore=makeStore(sessionState),preview=createPresenceService({api:{touch:async()=>{guestTouches+=1},list:async()=>[],leave:async()=>{},activeCount:async()=>0},session,congregation,store:previewStore,setIntervalFn(){throw new Error('Local-preview Presence must not schedule a heartbeat.')},clearIntervalFn(){}});
state=await preview.start();assert(state.status==='local-preview'&&guestTouches===0,'Local-preview Presence must not write cloud state.');await preview.dispose({remove:false});

sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}};memberships=[{congregationId:'c1',userId:'u1'}];
const scoped=createPresenceService({api:{touch:async()=>{},leave:async()=>{},list:async()=>[{congregation_id:'foreign',user_id:'u9',last_seen_at:new Date(now).toISOString(),surface:'BibleQuest'}],activeCount:async()=>0},session,congregation,store:makeStore(sessionState),clock:()=>now,setIntervalFn:()=>1,clearIntervalFn:()=>{}});
await scoped.start();let scopeFailed=false;try{await scoped.load('c1')}catch(error){scopeFailed=error.code==='BQ_PRESENCE_SCOPE'}assert(scopeFailed,'Foreign-congregation Presence data must fail closed.');await scoped.dispose({remove:false});
// --- Phase 3: privacy-safe activeCount aggregate ---
sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}};memberships=[{congregationId:'c1',userId:'u1'}];
const countStore=makeStore(sessionState),countService=createPresenceService({api,session,congregation,store:countStore,clock:()=>now,setIntervalFn:()=>1,clearIntervalFn:()=>{}});
await countService.start();
const countResult=await countService.activeCount('c1',30);
assert(countResult?.count===3&&countResult.windowMinutes===30,'activeCount must return the aggregate {count, windowMinutes}, not a row list.');
assert(activeCountCalls.at(-1).congregationId==='c1'&&activeCountCalls.at(-1).windowMinutes===30,'activeCount must forward the congregation and window to the API boundary.');
const foreignCount=await countService.activeCount('foreign-congregation',30);
assert(foreignCount===null,'activeCount must fail closed (return null) for a congregation the caller does not belong to, not call the API.');
assert(activeCountCalls.length===1,'activeCount must not call the API boundary for an out-of-scope congregation.');
const noCongCount=await countService.activeCount('',30);
assert(noCongCount===null,'activeCount must return null for a missing congregation id.');
await countService.dispose({remove:false});

sessionState={authenticated:false,remoteAvailable:true,user:null};
const signedOutCountService=createPresenceService({api,session,congregation,store:makeStore(sessionState),clock:()=>now,setIntervalFn:()=>1,clearIntervalFn:()=>{}});
const signedOutCount=await signedOutCountService.activeCount('c1',30);
assert(signedOutCount===null,'A signed-out caller must never receive an activeCount result.');

console.log('BibleQuest v3 Presence edge regression passed.');

import assert from 'node:assert/strict';
import { createProgressService } from '../src/core/progress.js';
import { createProgressCloudSyncService } from '../src/app/progress-cloud-sync.js';

function memoryStorage(){
  const map=new Map();
  return {
    read(key,fallback=null){return map.has(key)?structuredClone(map.get(key)):structuredClone(fallback)},
    write(key,value){map.set(key,structuredClone(value));return value}
  };
}
function memoryStore(){
  let state={};
  return {
    setState(patch){state=typeof patch==='function'?patch(state):{...state,...patch};return state},
    getState(){return structuredClone(state)}
  };
}
function session(userId='11111111-1111-1111-1111-111111111111'){
  const state={authenticated:true,user:{id:userId}};
  const listeners=new Set();
  return {
    getState(){return state},
    beforeSignOut(listener){listeners.add(listener);return()=>listeners.delete(listener)}
  };
}
function cloudApi(){
  let tick=0;
  let row={user_id:'11111111-1111-1111-1111-111111111111',state:{legacy_progress:{keep:true}},schema_version:1,updated_at:'2026-09-20T00:00:00.000Z'};
  return {
    async load(){return structuredClone(row)},
    async saveSlice(userId,key,value){
      tick+=1;
      row={user_id:userId,state:{...row.state,[key]:structuredClone(value)},schema_version:1,updated_at:`2026-09-20T00:00:${String(tick).padStart(2,'0')}.000Z`};
      return structuredClone(row);
    },
    inspect(){return structuredClone(row)}
  };
}
function makeProgress(day){
  const storage=memoryStorage(),store=memoryStore();
  let now=new Date(`${day}T12:00:00Z`);
  const progress=createProgressService({storage,store,clock:()=>new Date(now),timeZone:'UTC'});
  return {progress,setDay(value){now=new Date(`${value}T12:00:00Z`)},store};
}

const api=cloudApi(),account=session();
const a=makeProgress('2026-09-20'),b=makeProgress('2026-09-20');
const syncA=createProgressCloudSyncService({api,session:account,progress:a.progress});
const syncB=createProgressCloudSyncService({api,session:account,progress:b.progress});

a.progress.record({id:'device-a:first',type:'test.activity',xp:10,meaningful:true,rewards:{stars:2,coins:4}});
await syncA.flush();
assert.equal(api.inspect().state.biblequest_global_progress_v1.xp,10,'Device A progress must save into the account snapshot.');
assert.deepEqual(api.inspect().state.legacy_progress,{keep:true},'Global progress sync must preserve unrelated snapshot slices.');

await syncB.syncNow();
assert.equal(b.progress.getState().xp,10,'Device B must hydrate Device A XP.');
assert.equal(b.progress.getState().stars,2,'Device B must hydrate account reward balances.');
assert.equal(b.progress.getState().totalActivities,1);
assert.ok(b.progress.hasEvent('device-a:first'));

b.setDay('2026-09-21');
b.progress.record({id:'device-b:second',type:'test.activity',xp:5,meaningful:true,metrics:{quizCorrect:1}});
await syncB.flush();
assert.equal(api.inspect().state.biblequest_global_progress_v1.xp,15);
assert.equal(api.inspect().state.biblequest_global_progress_v1.streak,2,'Cross-device consecutive meaningful days must preserve the streak.');

await syncA.syncNow();
assert.equal(a.progress.getState().xp,15,'Device A must merge newer Device B progress.');
assert.equal(a.progress.getState().counters.quizCorrect,1);
assert.equal(a.progress.getState().streak,2);
assert.equal(Object.keys(a.progress.getState().events).length,2);

const duplicate=a.progress.record({id:'device-a:first',type:'test.activity',xp:10,meaningful:true,rewards:{stars:2,coins:4}});
assert.equal(duplicate.duplicate,true,'Account hydration must preserve stable-event idempotency.');
assert.equal(a.progress.getState().xp,15,'Duplicate event must not award XP after account resume.');
assert.equal(a.progress.getState().stars,2,'Duplicate event must not award rewards after account resume.');

a.setDay('2026-09-22');
b.setDay('2026-09-22');
a.progress.record({id:'device-a:third',type:'test.activity',xp:3,meaningful:false});
b.progress.record({id:'device-b:third',type:'test.activity',xp:7,meaningful:false});
await syncA.flush();
await syncB.syncNow();
await syncA.syncNow();
assert.equal(a.progress.getState().xp,25,'Distinct offline-ish device events must merge additively.');
assert.equal(b.progress.getState().xp,25);
assert.equal(Object.keys(a.progress.getState().events).length,4);
assert.equal(Object.keys(b.progress.getState().events).length,4);
assert.equal(api.inspect().state.biblequest_global_progress_v1.xp,25);

syncA.dispose();syncB.dispose();
console.log('BibleQuest V5 global progress account auto-resume regression passed.');

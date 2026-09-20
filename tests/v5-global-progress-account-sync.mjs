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
  let tick=0,beforeNextSave=null;
  let row={user_id:'11111111-1111-1111-1111-111111111111',state:{legacy_progress:{keep:true}},schema_version:1,updated_at:'2026-09-20T00:00:00.000Z'};
  const stamp=()=>`2026-09-20T00:00:${String(++tick).padStart(2,'0')}.000Z`;
  return {
    async load(){return structuredClone(row)},
    async saveSlice(userId,key,value,{expectedUpdatedAt=undefined}={}){
      if(beforeNextSave){
        row={...row,state:{...row.state,[key]:structuredClone(beforeNextSave)},updated_at:stamp()};
        beforeNextSave=null;
      }
      const actual=row.updated_at||null;
      const expected=expectedUpdatedAt===undefined?undefined:(expectedUpdatedAt||null);
      if(expected!==undefined&&expected!==actual){
        const error=new Error('simulated concurrent snapshot update');error.code='BQ_PROGRESS_SNAPSHOT_CONFLICT';throw error;
      }
      row={user_id:userId,state:{...row.state,[key]:structuredClone(value)},schema_version:1,updated_at:stamp()};
      return structuredClone(row);
    },
    conflictNextSaveWith(value){beforeNextSave=structuredClone(value)},
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

// A same-slice update arriving after load but before save must force re-read +
// semantic merge, never stale overwrite.
const cDevice=makeProgress('2026-09-23'),dDevice=makeProgress('2026-09-23');
cDevice.progress.mergeFromAccount(api.inspect().state.biblequest_global_progress_v1);
dDevice.progress.mergeFromAccount(api.inspect().state.biblequest_global_progress_v1);
cDevice.progress.record({id:'device-c:race',type:'test.activity',xp:2,meaningful:false});
dDevice.progress.record({id:'device-d:race',type:'test.activity',xp:4,meaningful:false});
const syncC=createProgressCloudSyncService({api,session:account,progress:cDevice.progress});
api.conflictNextSaveWith(dDevice.progress.exportAccountState());
await syncC.syncNow();
assert.equal(cDevice.progress.getState().xp,31,'Snapshot conflict retry must merge the competing device event before saving.');
assert.ok(cDevice.progress.hasEvent('device-c:race')&&cDevice.progress.hasEvent('device-d:race'),'Concurrent account progress events must both survive stale-write rejection.');
assert.equal(api.inspect().state.biblequest_global_progress_v1.xp,31,'Cloud snapshot must contain the merged concurrent progress result.');
syncC.dispose();

// The same stable event completed independently at different device times is a
// duplicate, not an identity conflict. Preserve the earliest first occurrence.
const eDevice=makeProgress('2026-09-24'),fDevice=makeProgress('2026-09-25');
eDevice.progress.mergeFromAccount(api.inspect().state.biblequest_global_progress_v1);
fDevice.progress.mergeFromAccount(api.inspect().state.biblequest_global_progress_v1);
eDevice.progress.record({id:'shared-offline-reader',type:'reader.chapter.read',xp:10,meaningful:true,metrics:{chaptersRead:1}});
fDevice.progress.record({id:'shared-offline-reader',type:'reader.chapter.read',xp:10,meaningful:true,metrics:{chaptersRead:1}});
const syncE=createProgressCloudSyncService({api,session:account,progress:eDevice.progress});
const syncF=createProgressCloudSyncService({api,session:account,progress:fDevice.progress});
await syncF.syncNow();
await syncE.syncNow();
assert.equal(eDevice.progress.getState().xp,41,'Same stable event from two devices must award only once after merge.');
assert.equal(api.inspect().state.biblequest_global_progress_v1.events['shared-offline-reader'].date,'2026-09-24','Account merge must retain the earliest occurrence date for a duplicated stable event.');
await syncF.syncNow();
assert.equal(fDevice.progress.getState().xp,41);
syncE.dispose();syncF.dispose();

syncA.dispose();syncB.dispose();
console.log('BibleQuest V5 global progress account auto-resume regression passed.');

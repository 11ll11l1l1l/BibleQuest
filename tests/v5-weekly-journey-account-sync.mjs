import assert from 'node:assert/strict';
import { createWeeklyJourneyService } from '../src/app/weekly-journey.js';
import { createWeeklyJourneyCloudSyncService } from '../src/app/weekly-journey-cloud-sync.js';

function memoryStorage(seed={}){
  const map=new Map(Object.entries(structuredClone(seed)));
  return {
    read(key,fallback=null){return map.has(key)?structuredClone(map.get(key)):structuredClone(fallback)},
    write(key,value){map.set(key,structuredClone(value));return value}
  };
}
function memoryOwnerStorage(){
  const map=new Map();
  return {
    getItem(key){return map.has(key)?map.get(key):null},
    setItem(key,value){map.set(key,String(value));return value},
    removeItem(key){map.delete(key)}
  };
}
function accountSession(userId='11111111-1111-1111-1111-111111111111'){
  const state={authenticated:true,user:{id:userId}};
  const listeners=new Set();
  return {
    getState(){return state},
    beforeSignOut(listener){listeners.add(listener);return()=>listeners.delete(listener)}
  };
}
function cloudApi(){
  let tick=0,beforeNextSave=null;
  let row={user_id:'11111111-1111-1111-1111-111111111111',state:{legacy_progress:{keep:true}},schema_version:1,updated_at:'2026-09-21T00:00:00.000Z'};
  const stamp=()=>`2026-09-21T00:00:${String(++tick).padStart(2,'0')}.000Z`;
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
        const error=new Error('simulated concurrent snapshot update');
        error.code='BQ_PROGRESS_SNAPSHOT_CONFLICT';
        throw error;
      }
      row={user_id:userId,state:{...row.state,[key]:structuredClone(value)},schema_version:1,updated_at:stamp()};
      return structuredClone(row);
    },
    conflictNextSaveWith(value){beforeNextSave=structuredClone(value)},
    inspect(){return structuredClone(row)}
  };
}
function makeWeekly(iso,storage=memoryStorage()){
  let now=new Date(iso);
  const service=createWeeklyJourneyService({
    storage,
    getDateKey:()=>now.toISOString().slice(0,10),
    clock:()=>new Date(now)
  });
  return {service,setTime(value){now=new Date(value)},storage};
}

const api=cloudApi(),session=accountSession();
const a=makeWeekly('2026-09-21T10:00:00.000Z');
const b=makeWeekly('2026-09-21T10:30:00.000Z');
const syncA=createWeeklyJourneyCloudSyncService({
  api,session,weeklyJourney:a.service,ownerStorage:memoryOwnerStorage(),cacheStorage:memoryStorage()
});
const syncB=createWeeklyJourneyCloudSyncService({
  api,session,weeklyJourney:b.service,ownerStorage:memoryOwnerStorage(),cacheStorage:memoryStorage()
});

a.service.setDone('recordings',true);
await syncA.flush();
assert.equal(api.inspect().state.biblequest_weekly_journey_v1.weeks['2026-09-21'].done.recordings,true);
assert.deepEqual(api.inspect().state.legacy_progress,{keep:true},'Weekly Journey sync must preserve unrelated snapshot slices.');

await syncB.syncNow();
assert.equal(b.service.snapshot().done.recordings,true,'Device B must resume Device A weekly completion.');
assert.equal(b.service.snapshot().nextRoute,'reader');

b.setTime('2026-09-21T11:00:00.000Z');
b.service.setDone('reader',true);
await syncB.flush();
await syncA.syncNow();
assert.equal(a.service.snapshot().completed,2,'Device A must merge Device B weekly progress.');
assert.equal(a.service.snapshot().nextRoute,'transform');

a.setTime('2026-09-21T12:00:00.000Z');
a.service.setDone('recordings',false);
await syncA.flush();
await syncB.syncNow();
assert.equal(b.service.snapshot().done.recordings,false,'A later Undo must propagate across devices.');
assert.equal(b.service.snapshot().done.reader,true,'Undoing one step must not erase a different completed step.');
assert.equal(b.service.snapshot().nextRoute,'recordings','Earliest unfinished step must remain the truthful resume target.');

// Concurrent devices changing different routes must merge, not overwrite.
const c=makeWeekly('2026-09-21T13:00:00.000Z');
const d=makeWeekly('2026-09-21T14:00:00.000Z');
c.service.mergeFromAccount(api.inspect().state.biblequest_weekly_journey_v1);
d.service.mergeFromAccount(api.inspect().state.biblequest_weekly_journey_v1);
c.service.setDone('transform',true);
d.service.setDone('assignments',true);
const syncC=createWeeklyJourneyCloudSyncService({
  api,session,weeklyJourney:c.service,ownerStorage:memoryOwnerStorage(),cacheStorage:memoryStorage()
});
api.conflictNextSaveWith(d.service.exportAccountState());
await syncC.syncNow();
assert.equal(c.service.snapshot().done.transform,true);
assert.equal(c.service.snapshot().done.assignments,true,'Snapshot conflict retry must preserve a different device’s route completion.');
assert.equal(api.inspect().state.biblequest_weekly_journey_v1.weeks['2026-09-21'].done.transform,true);
assert.equal(api.inspect().state.biblequest_weekly_journey_v1.weeks['2026-09-21'].done.assignments,true);

// Version-1 local state must migrate without losing previously completed steps.
const legacy=makeWeekly('2026-09-21T15:00:00.000Z',memoryStorage({
  'weekly-journey-state':{
    version:1,
    weeks:{
      '2026-09-21':{
        done:{recordings:true,reader:false,transform:true,'journey-groups':false,assignments:false,calendar:false},
        updatedAt:'2026-09-21T09:00:00.000Z'
      }
    }
  }
}));
assert.equal(legacy.service.snapshot().done.recordings,true);
assert.equal(legacy.service.snapshot().done.transform,true);
assert.equal(legacy.service.exportAccountState().version,2,'Legacy weekly state must migrate to the timestamped merge format.');

syncA.dispose();syncB.dispose();syncC.dispose();
console.log('BibleQuest V5 Weekly Journey account auto-resume regression passed.');

import assert from 'node:assert/strict';
import { createWeeklyJourneyService, WEEKLY_JOURNEY_ROUTES } from '../src/app/weekly-journey.js';

function memoryStorage(){
  const map=new Map();
  return {
    read(key,fallback=null){return map.has(key)?structuredClone(map.get(key)):structuredClone(fallback)},
    write(key,value){map.set(key,structuredClone(value));return value}
  };
}

const storage=memoryStorage();
let civil='2026-09-20';
let now=new Date('2026-09-20T12:00:00Z');
const create=()=>createWeeklyJourneyService({storage,getDateKey:()=>civil,clock:()=>now});

let service=create();
let state=service.snapshot();
assert.equal(state.weekKey,'2026-09-14','Weekly Journey must group Sunday into the Monday-based current week.');
assert.equal(state.completed,0);
assert.equal(state.nextRoute,'recordings');

let result=service.setDone('recordings',true);
assert.equal(result.applied,true);
assert.equal(result.state.completed,1);
assert.equal(result.state.nextRoute,'reader');

result=service.setDone('recordings',true);
assert.equal(result.applied,false,'Repeating the same completion must be idempotent.');
assert.equal(result.duplicate,true);

service=create();
state=service.snapshot();
assert.equal(state.completed,1,'Weekly Journey must resume persisted completion after service recreation.');
assert.equal(state.done.recordings,true);
assert.equal(state.nextRoute,'reader');

for(const route of WEEKLY_JOURNEY_ROUTES.slice(1)) service.setDone(route,true);
state=service.snapshot();
assert.equal(state.complete,true);
assert.equal(state.completed,WEEKLY_JOURNEY_ROUTES.length);
assert.equal(state.nextRoute,null);

service.toggle('reader');
state=service.snapshot();
assert.equal(state.complete,false);
assert.equal(state.done.reader,false);
assert.equal(state.nextRoute,'reader','Undo must make the earliest unfinished step the resume target.');

civil='2026-09-21';
now=new Date('2026-09-21T12:00:00Z');
state=service.snapshot();
assert.equal(state.weekKey,'2026-09-21');
assert.equal(state.completed,0,'A new Monday must start a fresh weekly journey without deleting prior week history.');
assert.equal(state.nextRoute,'recordings');

assert.throws(()=>service.setDone('unknown',true),/Unknown Weekly Journey route/);

console.log('BibleQuest V5 weekly journey resume regression passed.');

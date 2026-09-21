import assert from 'node:assert/strict';
import { createPersonalChallengesService } from '../src/app/personal-challenges.js';

function memoryStorage(seed={}){
  const map=new Map(Object.entries(structuredClone(seed)));
  return {
    read(key,fallback=null){return map.has(key)?structuredClone(map.get(key)):structuredClone(fallback)},
    write(key,value){map.set(key,structuredClone(value));return value}
  };
}
function make(storage=memoryStorage(),start='2026-09-21T03:00:00.000Z'){
  let now=new Date(start);
  const service=createPersonalChallengesService({storage,clock:()=>new Date(now)});
  return {service,storage,setTime(value){now=new Date(value)}};
}

const device=make();
assert.equal(device.service.list().length,10,'Personal Challenges must expose the ten reviewed V5 templates.');
let gospel=device.service.snapshot('gospel7');
assert.equal(gospel.started,false);
assert.equal(gospel.completed,0);
assert.equal(gospel.nextDay,1);
assert.equal(gospel.days[0].isNext,true);
assert.equal(gospel.days[1].locked,true);

const started=device.service.start('gospel7');
assert.equal(started.applied,true,'Start must persist independently of day completion.');
assert.equal(started.state.started,true);
assert.equal(started.state.completed,0);
const duplicateStart=device.service.start('gospel7');
assert.equal(duplicateStart.duplicate,true,'Starting an already-started challenge must be idempotent.');

assert.throws(()=>device.service.completeNext('gospel7',2),/Complete day 1/,'A user must not skip ahead in a Personal Challenge.');
device.setTime('2026-09-21T04:00:00.000Z');
let completed=device.service.completeNext('gospel7',1);
assert.equal(completed.applied,true);
assert.equal(completed.state.completed,1);
assert.equal(completed.state.nextDay,2);
assert.equal(completed.state.days[0].done,true);
assert.equal(completed.state.days[1].isNext,true);
assert.equal(completed.state.days[2].locked,true);

const reloaded=createPersonalChallengesService({storage:device.storage,clock:()=>new Date('2026-09-21T05:00:00.000Z')});
assert.equal(reloaded.snapshot('gospel7').started,true,'Started state must survive reload.');
assert.equal(reloaded.snapshot('gospel7').completed,1,'Completed days must survive reload.');
assert.equal(reloaded.snapshot('gospel7').nextDay,2,'Reload must resume at the first unfinished day.');

for(let day=2;day<=7;day++)reloaded.completeNext('gospel7',day);
gospel=reloaded.snapshot('gospel7');
assert.equal(gospel.complete,true);
assert.equal(gospel.completed,7);
assert.equal(gospel.nextDay,null);
const completedAgain=reloaded.completeNext('gospel7',7);
assert.equal(completedAgain.duplicate,true,'A completed challenge must not award or complete again.');

const a=make(memoryStorage(),'2026-09-22T01:00:00.000Z');
const b=make(memoryStorage(),'2026-09-22T02:00:00.000Z');
a.service.start('john21');
a.service.completeNext('john21',1);
b.service.start('john21');
b.service.completeNext('john21',1);
b.service.completeNext('john21',2);
a.service.mergeFromAccount(b.service.exportAccountState());
assert.equal(a.service.snapshot('john21').completed,2,'Account merge must keep the farther completed prefix.');
assert.equal(a.service.snapshot('john21').nextDay,3);

const legacy=createPersonalChallengesService({
  storage:memoryStorage({'personal-challenges-state-v1':{
    james5:{done:['1','2'],startedAt:'2026-09-20T00:00:00.000Z',updatedAt:'2026-09-20T01:00:00.000Z'}
  }}),
  clock:()=>new Date('2026-09-21T00:00:00.000Z')
});
assert.equal(legacy.snapshot('james5').completed,2,'Legacy done-array challenge state must normalize without losing progress.');
assert.equal(legacy.snapshot('james5').nextDay,3);

console.log('BibleQuest V5 active Personal Challenge state regression passed.');
